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
import { TEmbed } from "common/embed";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const homeEmbed: TEmbed = {
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
        is_element: true,
    };

    const [selectedItem, setSelectedItem] = useState<number>(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const embeds = [
        {
            title: "Events",
            src: "https://calendar.google.com/calendar/embed?src=c_8rrmu0a9da7jlegoen52aosglc%40group.calendar.google.com&ctz=America%2FLos_Angeles",
            documents: [],
            auto_dark: true,
            is_element: false,
        },
        {
            title: "Management",
            // src: (
            //     <div className="w-full h-full bg-content1 rounded-2xl p-6 flex justify-center flex-col items-center">
            //         <div
            //             className={clsx(
            //                 "text-2xl font-bold",
            //                 "text-foreground-400",
            //             )}
            //         >
            //             Events page
            //         </div>
            //         <div
            //             className={clsx(
            //                 "text-4xl font-bold",
            //                 "text-foreground-400 pb-5",
            //             )}
            //         >
            //             Blergh
            //         </div>
            //     </div>
            // ),
            src: "https://calendar.google.com/calendar/embed?src=c_7f0eb8454a7ab406a29fbfb27accb936db3f9d86ab859cebc3bcc78572d94e88%40group.calendar.google.com&ctz=America%2FLos_Angeles",
            documents: [],
            auto_dark: true,
            is_element: false,
        },
    ];

    const allEmbeds = [homeEmbed, ...embeds];
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
        <DefaultLayout className="px-8" pageHref="/">
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
                                        allEmbeds[selectedItem].is_element
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
                                        currentEmbed.is_element
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
