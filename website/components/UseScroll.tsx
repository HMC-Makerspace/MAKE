import React from "react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

export function useScroll<T>(
    content: T[],
    initialLength: number,
    incrementalLength: number,
): {
    visibleContent: T[];
    visibleContentLength: number;
    hasMoreContent: boolean;
    loaderRef: React.RefObject<HTMLElement>;
    scrollerRef: React.RefObject<HTMLElement>;
} {
    // The current number of items in content that are loaded in the DOM and
    // are visible to the user
    const [visibleContentLength, setVisibleContentLength] =
        React.useState(initialLength);

    // A function to load more content by updating the visible content length
    const loadMoreContent = React.useCallback(() => {
        console.log("loaded more!");
        setVisibleContentLength(visibleContentLength + incrementalLength);
    }, [visibleContentLength]);

    // Whether there is more content left
    const hasMoreContent = React.useMemo(
        () => visibleContentLength < content.length,
        [visibleContentLength, content.length],
    );

    // The list of currently visible content, sliced using visibleContentLength
    const visibleContent = React.useMemo(
        () => content.slice(0, visibleContentLength),
        [content, visibleContentLength],
    );

    const [loaderRef, scrollerRef] = useInfiniteScroll({
        hasMore: hasMoreContent,
        onLoadMore: loadMoreContent,
        shouldUseLoader: true,
    });

    // Create an infinite scroll ref to load more content as the user scrolls
    return {
        visibleContent,
        hasMoreContent,
        visibleContentLength,
        loaderRef,
        scrollerRef,
    };
}
