import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { TSchedule } from "common/schedule";
import { TUser } from "common/user";
import MAKETable from "../../../Table";
import clsx from "clsx";
import { SHIFT_EVENT_TYPE } from "../../../../../common/shift";
import { useQuery } from "@tanstack/react-query";
import { convertTimestampToDate } from "../../../../utils";
import { MAKEUser } from "../../../user/MAKEUser";

export default function ShiftHistoryModal({
    schedule: scheduleProp,
    isOpen,
    onOpenChange,
}: {
    schedule?: TSchedule;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: scheduleQuery, isLoading: scheduleLoading } =
        useQuery<TSchedule>({
            queryKey: ["schedule", "active"],
            refetchOnWindowFocus: false,
            enabled: !scheduleProp,
        });
    const schedule = scheduleProp ?? scheduleQuery;
    const shifts_with_history = schedule?.shifts.filter(
        (s) => s.history.length > 0,
    );
    const history_pairs = shifts_with_history?.reduce(
        (
            pairs: {
                shift_date: number;
                sec_start: number;
                sec_end: number;
                dropped_by: string;
                picked_up_by?: string;
            }[],
            shift,
            i,
        ) => {
            const drop_pickup_list: {
                shift_date: number;
                sec_start: number;
                sec_end: number;
                dropped_by: string;
                picked_up_by?: string;
            }[] = [];
            // Shift events are sorted by timestamp, with newest events last
            for (const event of shift.history) {
                const key = {
                    shift_date: event.shift_date,
                    sec_start: shift.sec_start,
                    sec_end: shift.sec_end,
                    dropped_by: shift.assignee,
                };
                const existing_event_index = drop_pickup_list.findIndex(
                    (e) =>
                        e.shift_date === key.shift_date &&
                        e.sec_start === key.sec_start &&
                        e.sec_end === key.sec_end &&
                        e.dropped_by === key.dropped_by,
                );
                if (
                    existing_event_index !== -1 &&
                    event.type === SHIFT_EVENT_TYPE.PICKUP
                ) {
                    const existing_event =
                        drop_pickup_list[existing_event_index];
                    drop_pickup_list[existing_event_index] = {
                        ...existing_event,
                        picked_up_by: event.initiator,
                    };
                } else {
                    drop_pickup_list.push(key);
                }
            }
            return pairs.concat(drop_pickup_list);
        },
        [],
    );

    history_pairs?.sort(
        (a, b) => b.shift_date - a.shift_date || b.sec_start - a.sec_start,
    );

    return (
        <Modal
            size="3xl"
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="overflow-auto"
        >
            <ModalContent className="overflow-auto">
                {(onClose) => (
                    <>
                        <ModalHeader>Shift History</ModalHeader>
                        <ModalBody
                            className={clsx(
                                "bg-default-200 rounded-xl flex flex-col",
                                "p-2 gap-2 m-2 overflow-auto max-h-[500px]",
                                "empty:content-['No events']",
                            )}
                        >
                            {schedule &&
                            history_pairs &&
                            history_pairs.length > 0
                                ? history_pairs.map((s) => {
                                      const row_start_time = new Date(
                                          0,
                                          0,
                                          0,
                                          0,
                                          0,
                                          s.sec_start,
                                      );
                                      const row_end_time = new Date(
                                          0,
                                          0,
                                          0,
                                          0,
                                          0,
                                          s.sec_end,
                                      );
                                      const row_start_str =
                                          row_start_time.toLocaleTimeString(
                                              "en-US",
                                              {
                                                  hour: "numeric",
                                                  minute: "numeric",
                                                  hour12: true,
                                              },
                                          );
                                      const row_end_str =
                                          row_end_time.toLocaleTimeString(
                                              "en-US",
                                              {
                                                  hour: "numeric",
                                                  minute: "numeric",
                                                  hour12: true,
                                              },
                                          );
                                      return (
                                          <div
                                              className={clsx(
                                                  "bg-default-300 rounded-lg grid",
                                                  "grid-cols-3 py-1 px-2 gap-4",
                                                  "items-center text-default-700",
                                                  "overflow-auto min-w-max min-h-fit",
                                              )}
                                          >
                                              <div>
                                                  {
                                                      convertTimestampToDate(
                                                          s.shift_date,
                                                      ).split(",")[0]
                                                  }{" "}
                                                  {row_start_str}
                                                  {" - "}
                                                  {row_end_str}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  Drop:{" "}
                                                  <MAKEUser
                                                      user_uuid={s.dropped_by}
                                                      size="md"
                                                      className="bg-default-200 pl-1"
                                                  />
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  Pickup:{" "}
                                                  {s.picked_up_by && (
                                                      <MAKEUser
                                                          user_uuid={
                                                              s.picked_up_by
                                                          }
                                                          size="md"
                                                          className="bg-default-200 pl-1"
                                                      />
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })
                                : "No shift events found."}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
