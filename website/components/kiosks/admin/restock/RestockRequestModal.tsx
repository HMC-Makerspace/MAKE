import { 
  Modal,
  ModalContent
} from "@heroui/react"
import { TRestockRequest } from "../../../../../common/restock"
import { TInventoryItem } from "common/inventory";

export default function RestockRequestModal({
    restockSelected,
    editIsOpen,
    editOnOpenChange,
    onSuccess,
    onError,
}: {
    restockSelected: TInventoryItem | null;
    editIsOpen: boolean;
    editOnOpenChange: () => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}) {
    return (
        <Modal
            isOpen={editIsOpen}
            placement="top-center"
            onOpenChange={editOnOpenChange}
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) =>
                    restockSelected ? (
                      <div>
                        <h1>hiiii</h1>
                      </div>
                    ) : null
                }
            </ModalContent>
        </Modal>
    );
}