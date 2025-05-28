import { Card, Selection, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import { TUser, TUserRole, UserUUID } from "common/user";
import clsx from "clsx";
import { useState } from "react";
import { TMachine } from "common/machine";
import { TCertification } from "common/certification";

export default function Machine({
    machines,
    roles,
    certifications,
}: {
    machines: TMachine[];
    roles: TUserRole[];
    certifications: TCertification[];
}) {
    return (
        <Card className="bg-default-200 w-full h-fit p-2" shadow="sm">
            Machine
        </Card>
    );
}
