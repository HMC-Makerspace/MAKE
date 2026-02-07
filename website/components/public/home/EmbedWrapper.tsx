import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { TEmbed, THomeEmbed } from "common/embed";
import { AnimatePresence, motion, usePresenceData, wrap } from "motion/react";
import { ForwardedRef, forwardRef } from "react";
import Embed from "./Embed";

const EmbedWrapper = forwardRef(function EmbedWrapper(
    {
        embed,
        distance = 300,
        duration = 0.5,
        delay = 0.05,
    }: {
        embed: TEmbed | THomeEmbed;
        distance?: number;
        duration?: number;
        delay?: number;
    },
    ref: ForwardedRef<HTMLDivElement>,
) {
    const direction: number = usePresenceData();

    return (
        <motion.div
            ref={ref}
            className="flex flex-col items-center justify-center size-full"
            initial={{
                opacity: 0,
                x: direction * distance,
            }}
            animate={{
                opacity: 1,
                x: 0,
                transition: {
                    delay: delay,
                    duration: duration,
                    ease: "easeInOut",
                },
            }}
            exit={{ opacity: 0, x: direction * -distance }}
            transition={{
                duration: duration,
                ease: "easeInOut",
            }}
        >
            {typeof embed.src !== "string" ? (
                embed.src
            ) : (
                <Embed embed={embed} />
            )}
        </motion.div>
    );
});

export default EmbedWrapper;
