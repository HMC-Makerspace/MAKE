import { API_SCOPE } from "common/global";
import { UNAUTHORIZED_ERROR, VerifyRequestHeader } from "common/verify";
import {
    createUser,
    getUser,
    getUserByEmail,
} from "controllers/user.controller";
import { verifyRequest } from "controllers/verify.controller";
import { createHash } from "crypto";
import { Router, Request, urlencoded } from "express";
import fs from "fs/promises";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { Strategy } from "passport-saml";

type EmailLoginRequest = Request<{}, {}, { email: string; passkey: string }>;

const router = Router();

// Define developmental login method
if (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_INSECURE_LOGIN
) {
    // Define developmental admin login
    router.get("/login", async (req, res, next) => {
        try {
            const user = await getUserByEmail("admin@admin.com"); // Default temporary admin account
            if (!user) {
                res.redirect("/");
                return;
            }
            req.login({ uuid: user.uuid }, (err) => {
                req.log.info({ msg: "Insecure admin login used", err: err });
                // Developmental admin login lasts for 2 years
                req.session.cookie.maxAge = 2 * 365 * 24 * 60 * 60 * 1000;
                if (err) {
                    // Pass errors to Express
                    next(err);
                } else {
                    // If successfully logged in, redirect to the main page
                    res.redirect("/");
                }
            });
        } catch (error) {
            next(error);
        }
    });
    // // Define per-user login
    // router.get("/login/:user_uuid", async (req, res, next) => {
    //     try {
    //         const user_uuid = req.params.user_uuid;
    //         if (!user_uuid) {
    //             res.redirect("/");
    //         }
    //         req.login({ uuid: user_uuid }, (err) => {
    //             req.log.info({ msg: "Insecure user login used", err: err });
    //             // Developmental logins last for 2 years
    //             req.session.cookie.maxAge = 2 * 365 * 24 * 60 * 60 * 1000;
    //             if (err) {
    //                 // Pass errors to Express
    //                 next(err);
    //             } else {
    //                 // If successfully logged in, redirect to the main page
    //                 res.redirect("/");
    //             }
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // });
}
// Define production SAML login methods
if (process.env.NODE_ENV === "production") {
    // Get IDP cert and clean up format
    const cert = await fs.readFile("make-idp.crt");
    const cert_string = cert
        .toString()
        .replace(/-+(BEGIN|END) CERTIFICATE-+/g, "");

    // Configure SAML Strategy
    passport.use(
        new Strategy(
            {
                passReqToCallback: true,
                entryPoint: process.env.IDP_ENTRY_POINT,
                callbackUrl: process.env.IDP_CALLBACK, // e.g., http://localhost:3000/login/callback
                issuer: process.env.IDP_ISSUER,
                cert: cert_string,
                identifierFormat: process.env.IDP_ID_FORMAT,
            },
            async (req, profile, done) => {
                if (!profile || !profile.email) {
                    req.log.fatal({
                        msg: "Invalid profile",
                        profile: profile,
                        req: req,
                    });
                    done(new Error("No profile found" + profile));
                    return;
                }
                const email = profile.email as string;
                const user_obj = await getUserByEmail(email);
                if (!user_obj) {
                    req.log.info({
                        msg: `User with email ${email} not found, creating`,
                        profile: profile,
                    });
                    let name = profile.displayName as string;
                    // Format names given as "last, first" to be "first last"
                    if (name.includes(",")) {
                        name = name
                            .split(",")
                            .map((word) => word.trim())
                            .reverse()
                            .join(" ");
                    }
                    const new_user_obj = {
                        uuid: crypto.randomUUID(),
                        name: name,
                        email: email,
                        college_id: "", // If not provided by IDP, fill in later
                        active_roles: [],
                        past_roles: [],
                        active_certificates: [],
                        past_certificates: [],
                    };
                    await createUser(new_user_obj);
                    done(null, { uuid: new_user_obj.uuid });
                } else {
                    done(null, { uuid: user_obj.uuid });
                }
            },
        ),
    );

    // Default SAML login
    router.get("/login", passport.authenticate("saml"));

    router.post(
        "/saml",
        urlencoded({ extended: false }),
        passport.authenticate("saml"),
        (req, res) => {
            res.redirect("/");
        },
    );
}

// Admin arbitrary user login
router.get("/login/:user_uuid", passport.session(), async (req, res, next) => {
    try {
        const requesting_uuid = req.user?.uuid as string;
        const user_uuid = req.params.user_uuid;
        req.log.debug({
            msg: `Attempting to login as ${user_uuid} by admin ${requesting_uuid}`,
        });
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn("No requesting_uuid was provided while logging in.");
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        // If the user is an administrator, allow them to login arbitrarily
        if (await verifyRequest(requesting_uuid, API_SCOPE.ADMIN)) {
            req.login({ uuid: user_uuid }, (err) => {
                req.log.info({
                    msg: `Admin arbitrary login used on user ${user_uuid}`,
                    err: err,
                });
                // Admin logins last for 1 year
                req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                if (err) {
                    // Pass errors to Express
                    next(err);
                } else {
                    // If successfully logged in, redirect to the main page
                    res.redirect("/");
                }
            });
        }
    } catch (error) {
        next(error);
    }
});

// Passkey login
router.post("/login/email/", async (req: EmailLoginRequest, res, next) => {
    const email = req.body.email;
    const passkey = req.body.passkey;
    if (!email || !passkey) {
        req.log.warn({
            msg: "No email provided when using passkey login.",
        });
        res.status(StatusCodes.UNAUTHORIZED).json({
            error: "Provided passkey authorization was invalid.",
        });
        return;
    }
    const user = await getUserByEmail(email);
    const passkey_hash = createHash("sha256").update(passkey).digest("hex");

    if (!user || !user.passkey || passkey_hash !== user.passkey) {
        // Failed to authorize via passkey
        req.log.warn({
            msg: "Arbitrary login used, and provided passkey authorization was invalid.",
            provided_passkey: passkey_hash,
            user_passkey: user?.passkey,
        });
        res.status(StatusCodes.UNAUTHORIZED).json({
            error: "Provided passkey authorization was invalid.",
        });
        return;
    }
    // If passkey hashes are the same, continue with login
    req.login({ uuid: user.uuid }, (err) => {
        req.log.info({
            msg: `Passkey login used by ${user.name} (${user.uuid})`,
            err: err,
        });
        // Passkey logins last for 1/2 year
        req.session.cookie.maxAge = 182 * 24 * 60 * 60 * 1000;
        if (err) {
            // Pass errors to Express
            next(err);
        } else {
            // If successfully logged in, redirect to the main page
            res.redirect("/");
        }
    });
});

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie("connect.sid"); // express-session cookie
            // If successfully logged out, redirect to the main page.
            res.redirect("/");
        });
    });
});

export default router;
