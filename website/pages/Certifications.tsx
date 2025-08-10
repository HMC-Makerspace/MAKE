import AdminLayout from "../layouts/AdminLayout";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Link,
    ScrollShadow,
    Selection,
    Spinner,
    Tooltip,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { TUser, TUserRole } from "common/user";
import {
    CERTIFICATION_VISIBILITY,
    TCertification,
} from "../../common/certification";
import CertificationCard from "../components/public/certifications/CertificationCard";
import DefaultLayout from "../layouts/Default";
import CertificationTag from "../components/kiosks/admin/certifications/CertificationTag";
import {
    easeInOut,
    motion,
    useMotionValueEvent,
    useScroll,
    useSpring,
    useTime,
    useTransform,
} from "framer-motion";
import {
    convertTimestampToDate,
    getForegroundColor,
    relativeTimestampToString,
} from "../utils";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function CertificationsPage() {
    // Get all data
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification", "public"],
            refetchOnWindowFocus: false,
        },
    );
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const { data: self } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    const [index, setIndex] = useState(0);

    const cert = certs ? certs[index] : undefined;

    const activeCert = self?.active_certificates?.find(
        (c) => c.certification_uuid === cert?.uuid,
    );

    const hasPrereqs = cert?.required_certifications?.every((cert) =>
        self?.active_certificates?.some(
            (certificate) =>
                certificate.certification_uuid === cert.certification_uuid &&
                certificate.level >= cert.required_level,
        ),
    );

    const initialTimestamp = useMemo(() => Date.now(), []);

    const activeValidTime =
        activeCert &&
        activeCert.timestamp_expires &&
        relativeTimestampToString(
            activeCert.timestamp_expires - initialTimestamp / 1000,
        ).split(", ")[0];

    return (
        <DefaultLayout
            pageHref={"/certifications"}
            className="px-4 pt-0 xl:pt-4 overflow-hidden"
            // className="overflow-auto pt-0 pb-0 xl:-ml-8"
        >
            <div className="size-full overflow-auto flex flex-col md:flex-row gap-4">
                <ScrollShadow className="h-1/2 md:h-full w-full md:w-3/5 flex overflow-y-auto py-8">
                    <div className="h-fit flex gap-4 flex-col overflow-y-scroll overflow-x-hidden">
                        {!self
                            ? [4, 1, 7, 3, 5, 2, 6].map((i) => (
                                  <div
                                      key={`skeleton-cert-${i}`}
                                      className={clsx(
                                          "h-auto bg-content2/60 border-2 border-content2",
                                          "text-lg py-1.5 px-2.5 rounded-sm w-fit flex",
                                          "items-center gap-1 blur-sm",
                                      )}
                                  >
                                      <BookmarkIcon
                                          strokeWidth={2}
                                          className="size-5 -ml-0.5"
                                      />
                                      Certification {"abc".repeat(i)}
                                  </div>
                              ))
                            : certs &&
                              certs.length > 0 &&
                              certs.map((cert, i) => {
                                  const color = cert.color;
                                  const foregroundColor =
                                      getForegroundColor(color);
                                  const highlight = i === index;
                                  const level = self?.active_certificates?.find(
                                      (c) => c.certification_uuid === cert.uuid,
                                  )?.level;
                                  return (
                                      <div key={cert.uuid}>
                                          <motion.div
                                              key={cert.uuid + "smallview"}
                                              initial={{
                                                  fontSize: "3.5vw",
                                                  backgroundColor: highlight
                                                      ? color
                                                      : color + "aa",
                                                  borderColor: color,
                                              }}
                                              layout
                                              animate={{
                                                  fontSize:
                                                      i === index
                                                          ? "5vw"
                                                          : "3.5vw",
                                                  // width: i === index ? "100%" : "fit-content",
                                                  backgroundColor: highlight
                                                      ? color
                                                      : color + "aa",
                                                  borderColor: color,
                                              }}
                                              whileTap={{
                                                  scale: 0.98,
                                              }}
                                              className={clsx(
                                                  "p-1.5 flex flex-row gap-1 w-fit h-auto px-2.5 rounded-sm",
                                                  "content-center items-center border-2 max-w-full",
                                                  "origin-left box-border cursor-pointer lg:hidden",
                                                  highlight && "shadow-md",
                                              )}
                                              onTap={() => setIndex(i)}
                                          >
                                              <motion.div
                                                  initial={{
                                                      width: "1.25rem",
                                                      height: "1.25rem",
                                                      minWidth: "1.25rem",
                                                      minHeight: "1.25rem",
                                                  }}
                                                  animate={{
                                                      width: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      minWidth: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      height: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      minHeight: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                  }}
                                              >
                                                  <BookmarkIcon
                                                      color={foregroundColor}
                                                      strokeWidth={2}
                                                      className="-ml-0.5"
                                                  />
                                              </motion.div>
                                              <h1
                                                  className="font-semibold text-nowrap"
                                                  style={{
                                                      color: foregroundColor,
                                                  }}
                                              >
                                                  {cert.name}
                                              </h1>
                                              {level !== undefined &&
                                                  level !== 0 && (
                                                      <div
                                                          className="pl-2 font-semibold"
                                                          style={{
                                                              color: foregroundColor,
                                                          }}
                                                      >
                                                          {level}
                                                      </div>
                                                  )}
                                          </motion.div>
                                          <motion.div
                                              key={cert.uuid + "largeview"}
                                              initial={{
                                                  fontSize: "100%",
                                                  backgroundColor: highlight
                                                      ? color
                                                      : color + "aa",
                                                  borderColor: color,
                                              }}
                                              layout
                                              animate={{
                                                  fontSize:
                                                      i === index
                                                          ? "150%"
                                                          : "100%",
                                                  // width: i === index ? "100%" : "fit-content",
                                                  backgroundColor: highlight
                                                      ? color
                                                      : color + "aa",
                                                  borderColor: color,
                                              }}
                                              whileTap={{
                                                  scale: 0.98,
                                              }}
                                              className={clsx(
                                                  "p-1.5 flex-row gap-1 w-fit h-auto px-2.5 rounded-sm",
                                                  "content-center items-center border-2 max-w-full overflow-x-auto",
                                                  "origin-left box-border cursor-pointer hidden lg:flex",
                                                  highlight && "shadow-md",
                                              )}
                                              onTap={() => setIndex(i)}
                                          >
                                              <motion.div
                                                  initial={{
                                                      width: "1.25rem",
                                                      height: "1.25rem",
                                                      minWidth: "1.25rem",
                                                      minHeight: "1.25rem",
                                                  }}
                                                  animate={{
                                                      width: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      minWidth: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      height: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                      minHeight: highlight
                                                          ? "1.875rem"
                                                          : "1.25rem",
                                                  }}
                                              >
                                                  <BookmarkIcon
                                                      color={foregroundColor}
                                                      strokeWidth={2}
                                                      className="-ml-0.5"
                                                  />
                                              </motion.div>
                                              <h1
                                                  className="font-semibold text-nowrap"
                                                  style={{
                                                      color: foregroundColor,
                                                  }}
                                              >
                                                  {cert.name}
                                              </h1>
                                              {level !== undefined &&
                                                  level !== 0 && (
                                                      <div
                                                          className="pl-1 font-semibold"
                                                          style={{
                                                              color: foregroundColor,
                                                          }}
                                                      >
                                                          {level}
                                                      </div>
                                                  )}
                                          </motion.div>
                                      </div>
                                  );
                              })}
                    </div>
                </ScrollShadow>
                <Card className="size-full p-2 overflow-auto">
                    <CardHeader
                        className={clsx(
                            "text-3xl font-semibold",
                            !self && "h-full",
                        )}
                    >
                        {cert?.name ?? ""}
                        {!self ? (
                            <div className="text-center w-full">
                                Please login to view our certifications.
                            </div>
                        ) : (
                            certs &&
                            certs.length === 0 && (
                                <div className="text-center w-full">
                                    No certifications available
                                    <br />
                                    <div className="text-base font-normal pt-1">
                                        Please check back soon!
                                    </div>
                                </div>
                            )
                        )}
                    </CardHeader>
                    <CardBody className="gap-4">
                        <div className="md:text-lg whitespace-pre-line">{cert?.description}</div>
                        {cert?.required_certifications &&
                            cert.required_certifications.length > 0 && (
                                <div
                                    className={clsx(
                                        "w-full flex gap-4 bg-content2 rounded-lg p-3",
                                        "items-center",
                                        cert?.required_certifications
                                            ?.length === 1
                                            ? "flex-row justify-between"
                                            : "flex-col",
                                    )}
                                >
                                    <div className="text-xl font-medium">
                                        Prerequisites:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {cert?.required_certifications?.map(
                                            (req_cert, i) => (
                                                <CertificationTag
                                                    key={`cert-${cert.uuid}-prereq-${req_cert.certification_uuid}`}
                                                    cert_uuid={
                                                        req_cert.certification_uuid
                                                    }
                                                    level={
                                                        req_cert.required_level
                                                    }
                                                    certifications={certs}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </CardBody>
                    <CardFooter className="flex flex-col gap-2 overflow-visible">
                        {cert?.documents && cert.documents.length > 0 && (
                            <Tooltip
                                isDisabled={hasPrereqs}
                                content={"Missing prerequisites!"}
                                color="primary"
                                showArrow
                            >
                                <div
                                    className={clsx(
                                        "w-full bg-content2 rounded-lg flex flex-wrap gap-2",
                                        "p-4 mt-auto relative justify-center",
                                    )}
                                >
                                    {activeCert && (
                                        <div
                                            className={clsx(
                                                "p-3 flex gap-2 bg-success-300/80 border-3 rounded-lg",
                                                "border-success-300 text-success-foreground font-medium",
                                                "absolute -top-[3.75rem]",
                                            )}
                                        >
                                            {activeCert.timestamp_expires ? (
                                                <>
                                                    <div className="font-semibold w-full">
                                                        Level {activeCert.level}{" "}
                                                        Certified until:
                                                    </div>
                                                    <div className="whitespace-nowrap">
                                                        {activeValidTime}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="font-semibold w-full">
                                                        Passed Level{" "}
                                                        {activeCert.level}:
                                                    </div>
                                                    <div className="whitespace-nowrap">
                                                        {convertTimestampToDate(
                                                            activeCert.timestamp_granted,
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {cert?.documents?.map((doc, i) => (
                                        <Button
                                            key={`cert-${cert.uuid}-doc-${i}`}
                                            color="primary"
                                            variant="shadow"
                                            className="w-full font-medium"
                                            size="lg"
                                            href={hasPrereqs ? doc.link : ""}
                                            as={Link}
                                            isExternal
                                            isDisabled={!hasPrereqs}
                                        >
                                            {doc.name}
                                        </Button>
                                    ))}
                                </div>
                            </Tooltip>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* <div className="size-full flex flex-row overflow-auto">
                <div className="w-full h-full fixed ">
                    {publicCerts.map((cert, i) => {
                        const index = scrollIndex;
                        const pos = i - index;
                        const isSelected = i === index;
                        const sign = i > index ? 1 : -1;
                        const distance =
                            pos * 3 + (isSelected ? 0 : sign * 0.8);
                        return (
                            <motion.div
                                key={`${cert.uuid}-box-lg`}
                                className="hidden sm:block"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    // offsetPath: 'path("M 100 0 A 100 300 0 0 1 100 300")',
                                    offsetPath: "circle(20% at -200px 50%)",
                                    rotate: "-90deg",
                                    width: "fit-content",
                                    height: "fit-content",
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                }}
                                initial={{
                                    offsetDistance: `${distance}%`,
                                    // borderWidth: isSelected ? 10 : 0,
                                }}
                                animate={{
                                    offsetDistance: `${distance}%`,
                                    opacity:
                                        index > i + 1 || index < i - 1
                                            ? 0.6
                                            : 1,
                                    // marginLeft: isSelected ? 40 : 0,
                                    scale: isSelected ? 1.3 : 1,
                                }}
                                // animate={{
                                //     offsetDistance: `${(i + index * 1.2 - 100}%`,
                                //     borderWidth: i === index ? 2 : 0,
                                // }}
                            >
                                <div className="w-0 h-fit">
                                    <CertificationTag
                                        cert_uuid={cert.uuid}
                                        certifications={publicCerts}
                                        highlight={i === index}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div
                    className="w-full h-full overflow-scroll z-10"
                    style={{ direction: "rtl" }}
                    ref={carouselRef}
                >
                    <div className="h-[143vh] "></div>
                </div>
            </div> */}
            {/* <h1 className="text-3xl font-bold pb-4">Held Certifications</h1>
                <div className="grid grid-cols-3 gap-4 overflow-auto">
                    {heldCerts.map((cert) => (
                        <CertificationCard cert={cert} />
                    ))}
                </div>
                <h1 className="text-3xl font-bold pb-4">
                    Available Certifications
                </h1>
                <div className="grid grid-cols-3 gap-4 overflow-auto">
                    {unHeldCerts.slice(1, 2).map((cert) => (
                        <CertificationCard cert={cert} />
                    ))}
                </div>
                <h1 className="text-3xl font-bold py-4">Missing Prereq</h1>
                <div className="grid grid-cols-3 gap-4 overflow-auto opacity-50">
                    {unHeldCerts.toSpliced(1, 1).map((cert) => (
                        <CertificationCard cert={cert} />
                    ))}
                </div> */}
        </DefaultLayout>
    );
}
