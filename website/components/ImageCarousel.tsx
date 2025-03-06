
import React, {useEffect, useState} from "react";
import { FILE_RESOURCE_TYPE, FileUUID, TFile } from "../../common/file.ts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios"
import { UUID } from "../../common/global.ts";
import {
   Button,
   Modal,
   ModalContent,
   ModalHeader,
   ModalFooter,
   ModalBody,
   useDisclosure,
} from "@heroui/react";
import {
   TrashIcon,
   PencilSquareIcon,
   ChevronLeftIcon,
   ChevronRightIcon,
   PlusIcon,
} from "@heroicons/react/24/outline";


export default function ImageCarousel({ uuid, fileType, editable }: { uuid: UUID; fileType: FILE_RESOURCE_TYPE; editable: boolean }) {

   const [index, setIndex] = React.useState<number>(0);
   const [images, setImages] = React.useState<TFile[]>([]);

   const fetchData = async () => {
       const url = `/api/v3/file/by/${fileType}/${uuid}`;
       const response = await axios.get(url);
       setImages(response.data);
   }


   useEffect(() => {
       fetchData();
   }, [])


   //going to next slide functionality
   const nextImage = () => {
       setIndex((index + 1) % images.length);
   }
   const prevImage = () => {
       setIndex((index - 1 + images.length) % images.length);
   }

   // Manage modal state
   const { isOpen: editIsOpen,
       onOpen: editOnOpen,
       onOpenChange: editOnOpenChange,
   } = useDisclosure();


   const deleteImage = async (file_uuid: FileUUID, index:number) => {
       // delete from backend functionality
       const url = `/api/v3/file/by/${fileType}/${file_uuid}`
       try {
           const response = await axios.delete(url)
       } catch (error:any) {
           console.error('Error deleting file:', error.response?.data || error.message);
       }
       //reload images
       const tempImages = [...images]
       tempImages.splice(index, 1)
       setImages(tempImages)
   }


   // letting users upload their own image
   const uploadImage = async (file: File) => {
       const formData = new FormData();
       formData.append("file", file);

       const url = `/api/v3/file/for/${fileType}/${uuid}`;

       try {
           const response = await axios.post(url, formData, {
               headers: {
                   "Content-Type": "multipart/form-data",
               },
           });
           //reloading image
           setImages([...images, response.data])


           console.log("File uploaded successfully", response.data);
       }
       catch (error: any) {
           console.error('Error uploading file:', error.response?.data || error.message);
       }
   }


   // getting the image user wants
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
       if (e.target.files) {
           uploadImage(e.target.files[0]);
       }
   };


   //Modal for Editing
   function EditModal({ editIsOpen, editOnOpenChange, }: { editIsOpen: boolean; editOnOpenChange: () => void; }) {
       return (
           <>
               <input type="file" id="imageUpload" className="hidden" onChange={handleFileChange}/>
               <ModalContent className="flex flex-col justify-center">
                   <ModalHeader>Add and Delete Images</ModalHeader>


                   <ModalBody>
                       <div className="flex flex-row flex-wrap gap-6 items-center justify-center">
                           {images.map((image, index) => {
                               return (
                                   <div key={index} className="w-[45%] h-[30vh] flex flex-col items-center gap-4">
                                       <img className="w-full h-3/4 object-cover" src={image.path ? `/api/v3/file/download/${images[index].uuid}` :  undefined} /> {/* change src to images[index].path*/}
                                       <div className="flex gap-4 flex-row items-center">
                                           {/* <Button color="primary" isIconOnly onPress={() => {document.getElementById("imageUpload")?.click();}}>
                                               <PencilSquareIcon className="size-6" />
                                           </Button>  */}
                                           <Button isIconOnly color="danger" onPress={() => deleteImage(image.uuid, index)}>
                                               <TrashIcon className="size-6" />
                                           </Button>
                                       </div>
                                   </div>
                               )
                           }
                           )}


                           <div className={images.length % 2 ? "w-[45%] h-[7vw] flex flex-col items-center  gap-2" : "w-[45%] h-[4vw] flex flex-col items-center justify-center gap-2"}>
                               <Button
                                 color="primary"
                                 endContent={<PlusIcon className="size-6" />}
                                 onPress={() => {document.getElementById("imageUpload")?.click();}}
                               >
                                   Add New Images
                               </Button>
                           </div>
                       </div>
                   </ModalBody>


                   <ModalFooter>
                       <Button color="primary" variant="flat" onPress={editOnOpenChange} >
                           Done
                       </Button>
                   </ModalFooter>
               </ModalContent>
           </>
          
       );
   }


   return (
       <div>
           <div className='flex flex-row gap-2 items-center jusitfy-center'>
              
               <Button isIconOnly onPress={prevImage}>
                   <ChevronLeftIcon className="size-6" />
               </Button>
             
               <div className='relative'>
                   <img className="w-96 h-52 object-cover" src={images[index] ? `/api/v3/file/download/${images[index].uuid}` : undefined} /> {/* change src to images[index].path*/}
                   {editable &&
                       <Button isIconOnly className='absolute bottom-2 right-2' onPress={editOnOpenChange}>
                           <PencilSquareIcon className="size-6" />
                       </Button>
                   }
                  
               </div>
               <Button isIconOnly onPress={nextImage}>
                   <ChevronRightIcon className="size-6" />
               </Button>
           </div>

           <Modal
               isOpen={editIsOpen}
               placement="top-center"
               onOpenChange={editOnOpenChange}
               className="flex flex-col justify-center overflow-auto"
               size="xl"
               scrollBehavior="inside"
               classNames={{
                   base: "w-full max-w-3xl overflow-auto",
               }}
           >
               <EditModal editIsOpen={editIsOpen} editOnOpenChange={editOnOpenChange} />
           </Modal>
       </div>
   )
  
}
