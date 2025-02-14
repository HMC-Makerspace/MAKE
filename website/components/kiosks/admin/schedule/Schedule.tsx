import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";

export default function Schedule({
    schedule,
    config,
    isLoading,
}: {
    schedule?: TSchedule;
    config?: TConfig;
    isLoading: boolean;
}) {}
