import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import { StarIcon } from "@heroicons/react/24/outline";
import React from "react"


export default function RestockType({ request_status, card } :{request_status: number; card: boolean}) {
    // card colors and card titles
    let text_titles = ["Pending", "Waiting", "Ordered", "Restocked", "Denied"]
    let color_types = ["#808080", "#F9C97C", "#F5A524", "#45D483", "#FF474D"]

    // if it is a card, return a card, else return a circle
    if (card) {
        return (
            <Card
                className="p-1.5 flex flex-row gap-1 w-fit px-2.5"
                style={{ backgroundColor: color_types[request_status] }}
            >
                <h1
                    style={{
                        color: "black",
                    }}
                >{text_titles[request_status]}
                </h1>
            </Card>
        )
    }
    else {
        return (
            <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: color_types[request_status] }}
            >
                
            </div>
        )
    }
    
}

