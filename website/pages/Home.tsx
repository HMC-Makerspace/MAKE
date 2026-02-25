import DefaultLayout from "../layouts/Default";
import MAKE from "../components/public/home/MAKE";
import clsx from "clsx";
import ActiveAlert from "../components/public/home/ActiveAlert";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";
import { AnimatePresence, motion, wrap } from "motion/react";
import HomeLinks from "../components/public/home/HomeLinks";
import { useState } from "react";
import EmbedWrapper from "../components/public/home/EmbedWrapper";
import { THomeEmbed, TEmbed } from "common/embed";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const { data: embeds, isLoading: embedsLoading } = useQuery<TEmbed[]>({
        queryKey: ["embed", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const homeEmbed: THomeEmbed = {
        uuid: "home",
        title: "Home",
        src: (
            <>
                <div
                    className={clsx(
                        "text-2xl font-bold",
                        "text-foreground-400",
                    )}
                >
                    Welcome to
                </div>
                <MAKE
                    className={clsx(
                        "text-[7.5rem] md:text-[10rem] tracking-widest",
                        "font-black text-foreground-600",
                        "-mt-8",
                    )}
                    hover={false}
                    href={""}
                />
                {config && <HomeLinks config={config} />}
            </>
        ),
        documents: [],
    };

    const [selectedItem, setSelectedItem] = useState<number>(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const allEmbeds = (config?.general.hide_home_embed
        ? embeds
        : [homeEmbed, ...(embeds ?? [])]) ?? [homeEmbed, ...(embeds ?? [])];
    const count = allEmbeds.length;

    function setSlide(newDirection: 1 | -1) {
        const nextItem = wrap(0, count, selectedItem + newDirection);
        setSelectedItem(nextItem);
        setDirection(newDirection);
    }

    const currentEmbed = allEmbeds[selectedItem];
    const prevEmbed = allEmbeds[wrap(0, count, selectedItem - 1)];
    const nextEmbed = allEmbeds[wrap(0, count, selectedItem + 1)];

    return (
        <DefaultLayout className="px-8 overscroll-y-none" pageHref="/">
            <div className="relative flex flex-col items-center justify-center h-full">
                <ActiveAlert />
                <div className="size-full flex flex-row items-center pt-4">
                    <AnimatePresence>
                        {(count > 2 || (count === 2 && selectedItem === 1)) && (
                            <motion.div
                                className="absolute flex h-full -left-4 bottom-0.5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeInOut",
                                }}
                            >
                                <motion.button
                                    className={clsx(
                                        "flex relative border-0 pr-1 pl-4 ",
                                        "rounded-xl items-center transition-colors-opacity",
                                        "gap-1 justify-end",
                                        typeof allEmbeds[selectedItem].src !==
                                            "string"
                                            ? "self-end md:self-center"
                                            : "self-end",
                                    )}
                                    onClick={() => setSlide(-1)}
                                    layout
                                    whileHover={{
                                        opacity: 0.7,
                                    }}
                                    whileTap={{
                                        background: "transparent",
                                    }}
                                >
                                    <ChevronLeftIcon
                                        className="size-8 text-primary-300"
                                        strokeWidth={2.5}
                                    />
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={`prev${selectedItem}`}
                                            className="text-xl text-primary-500"
                                            initial={{
                                                opacity: 0.5,
                                            }}
                                            animate={{
                                                opacity: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeIn",
                                            }}
                                        >
                                            {prevEmbed.title}
                                        </motion.span>
                                    </AnimatePresence>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence
                        mode="popLayout"
                        initial={false}
                        custom={direction}
                    >
                        <EmbedWrapper key={selectedItem} embed={currentEmbed} />
                    </AnimatePresence>
                    <AnimatePresence initial={false}>
                        {count > 1 && !(count === 2 && selectedItem === 1) && (
                            <motion.div
                                className="absolute flex h-full -right-2 bottom-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeInOut",
                                }}
                            >
                                <motion.button
                                    className={clsx(
                                        "flex relative border-0 pr-1 pl-4 ",
                                        "rounded-xl items-center transition-colors-opacity",
                                        "gap-1 justify-end",
                                        typeof currentEmbed.src !== "string"
                                            ? "self-end md:self-center"
                                            : "self-end",
                                    )}
                                    onClick={() => setSlide(1)}
                                    layout
                                    whileHover={{
                                        opacity: 0.7,
                                    }}
                                    whileTap={{
                                        background: "transparent",
                                    }}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={`next${selectedItem}`}
                                            className="text-xl text-primary-500"
                                            initial={{
                                                opacity: 0,
                                            }}
                                            animate={{
                                                opacity: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                            }}
                                            transition={{
                                                duration: 0.1,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            {nextEmbed.title}
                                        </motion.span>
                                    </AnimatePresence>
                                    <ChevronRightIcon
                                        className="size-8 text-primary-300"
                                        strokeWidth={2.5}
                                    />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="h-14" />
            </div>
        </DefaultLayout>
    );
}
