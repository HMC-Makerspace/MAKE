import { Accordion, AccordionItem, Spacer } from "@heroui/react";
import clsx from "clsx";
import { TFAQItem } from "common/config";
import { Link } from "react-router-dom";

const DEPTH_TITLE_SIZES = [
    "text-5xl",
    "text-3xl",
    "text-xl",
    "text-lg",
    "text-base",
];

const DEPTH_BODY_SIZES = [
    "text-2xl",
    "text-lg",
    "text-medium",
    "text-base",
    "text-sm",
];

export default function StaticFAQItem({
    faq_item,
    index = 0,
    depth = 0,
}: {
    faq_item: TFAQItem;
    index?: number;
    depth?: number;
}) {
    // Interpret Markdown-style links
    const sep_regex = new RegExp(/\[[^\]]*\]\([^\)]*\)/g);
    const link_regex = new RegExp(/\[([^\]]*)\]\(([^\)]*)\)/g);
    const separated_text = faq_item.description?.split(sep_regex);
    const links = faq_item.description?.matchAll(link_regex).toArray();

    return (
        <Accordion
            variant={faq_item.bordered ? "bordered" : "light"}
            defaultExpandedKeys={faq_item.default_open ? ["item"] : undefined}
            selectedKeys={faq_item.always_open ? ["item"] : undefined}
            hideIndicator={faq_item.always_open}
            className="border-default-200"
            showDivider
        >
            <AccordionItem
                key="item"
                title={faq_item.title}
                classNames={{
                    title: clsx(
                        "font-semibold",
                        faq_item.title_centered ? "text-center" : "",
                        depth < DEPTH_TITLE_SIZES.length
                            ? DEPTH_TITLE_SIZES[depth]
                            : DEPTH_TITLE_SIZES[-1],
                    ),
                    trigger: clsx(
                        faq_item.always_open && "cursor-default",
                        !faq_item.bordered &&
                            "border-default-200 border-b-2 pb-2",
                    ),
                }}
            >
                <div
                    className={clsx(
                        faq_item.bordered &&
                            "border-default-200 border-t-2 pt-2 -mt-2",
                        "whitespace-pre-line",
                        depth < DEPTH_BODY_SIZES.length
                            ? DEPTH_BODY_SIZES[depth]
                            : DEPTH_BODY_SIZES[-1],
                    )}
                >
                    {separated_text?.map((text, i) => (
                        <span key={`faq-i${index}-d${depth + 1}-text${i}`}>
                            <span>{text}</span>
                            {links && i < links.length ? (
                                <Link
                                    to={links[i][2]}
                                    className="underline text-primary-300"
                                >
                                    {links[i][1]}
                                </Link>
                            ) : (
                                <></>
                            )}
                        </span>
                    ))}
                </div>
                <Spacer y={2} />
                {faq_item.children && faq_item.children.length > 0 && (
                    <div
                        className="w-full grid gap-2"
                        style={{
                            gridTemplateColumns: `repeat(${faq_item.children_columns ?? 1}, minmax(0, 1fr))`,
                        }}
                    >
                        {faq_item.children?.map((child, i) => (
                            <StaticFAQItem
                                key={`faq-i${index}-c${i}-d${depth + 1}`}
                                faq_item={child}
                                index={i}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </AccordionItem>
        </Accordion>
        // <div className="flex flex-col pl-2 gap-3">
        //     {faq_item?.children?.map((child, i) => (
        //         <EditableFAQItem
        //             key={`faq-i${index}-c${i}`}
        //             item={child}
        //             index={i}
        //             setItem={setter}
        //             deleteItem={(i) =>
        //                 setItem(
        //                     {
        //                         ...faq_item,
        //                         children: (
        //                             faq_item.children ?? []
        //                         ).toSpliced(i, 1),
        //                     },
        //                     index,
        //                 )
        //             }
        //         />
        //     ))}
        // </div>
    );
}
