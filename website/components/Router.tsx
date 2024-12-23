import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home";
import Test from "./Test";

// Create a basic router to access all relevant site pages
const router = createBrowserRouter([
    // Path to home page
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/test",
        element: <Test />,
    },
    // add paths to kiosks, etc.
]);

/**
 * Create a router for directing traffic around the front end site.
 * @returns The site router element
 */
export function Router() {
    return <RouterProvider router={router} />;
}
