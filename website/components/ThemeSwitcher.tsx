import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-row space-x-4">
            <span>The current theme is: {theme}</span>
            <Button
                onPress={() => setTheme("light")}
                variant="faded"
                className="light"
                color="primary"
            >
                Light Mode
            </Button>
            <Button
                onPress={() => setTheme("dark")}
                variant="faded"
                color="primary"
                className="dark"
            >
                Dark Mode
            </Button>
        </div>
    );
}
