import { Card } from "@heroui/react";
import { TEmbed } from "common/embed";
import { useTheme } from "next-themes";

export default function Embed({ embed }: { embed: TEmbed }) {
    const { theme } = useTheme();
    return (
        <Card className="size-full p-2 rounded-3xl">
            <div className="h-20 text-center w-full content-center">
                Put documents here...
            </div>
            {typeof embed.src === "string" ? (
                <iframe
                    src={embed.src}
                    className="rounded-2xl h-full"
                    style={
                        embed.auto_dark && theme === "dark"
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
        </Card>
    );
}
