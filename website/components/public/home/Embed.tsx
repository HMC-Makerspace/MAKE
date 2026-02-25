import { Button, Card, ScrollShadow } from "@heroui/react";
import clsx from "clsx";
import { TEmbed, THomeEmbed } from "common/embed";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";

export default function Embed({ embed }: { embed: TEmbed | THomeEmbed }) {
    const { theme } = useTheme();
    return (
        <Card className="size-full p-2 rounded-3xl gap-2 overflow-auto">
            {typeof embed.src === "string" ? (
                <iframe
                    src={embed.src}
                    className="rounded-2xl h-full"
                    style={
                        embed.auto_invert && theme === "dark"
                            ? {
                                  WebkitFilter:
                                      "invert(90%) hue-rotate(180deg)",
                                  filter: "invert(90%) hue-rotate(180deg)",
                              }
                            : {}
                    }
                />
            ) : (
                embed.src
            )}
            {embed.documents && embed.documents.length > 0 && (
                <ScrollShadow
                    orientation="horizontal"
                    hideScrollBar
                    // visibility="both"
                    className={clsx(
                        "w-full justify-self-center relative overflow-y-hidden",
                        "transition-colors-opacity",
                    )}
                >
                    <div
                        className={clsx(
                            "left-0 right-0 mx-auto w-fit flex",
                            "flex-row overflow-x-auto gap-4 pb-2 pr-2",
                            "justify-center rounded-xl justify-self-center",
                        )}
                    >
                        {embed.documents.map((doc) => (
                            <Button
                                variant="solid"
                                color="primary"
                                as={Link}
                                to={doc.link}
                                size="lg"
                                className="rounded-full font-semibold px-12"
                            >
                                {doc.name}
                            </Button>
                        ))}
                    </div>
                </ScrollShadow>
            )}
        </Card>
    );
}
