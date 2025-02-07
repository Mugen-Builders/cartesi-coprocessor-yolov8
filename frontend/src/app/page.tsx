'use client'
import { ChangeEvent, useState } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [entropy, setEntropy] = useState<number>(1);
  const { toast } = useToast();

  function imageToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64WithoutPrefix = reader.result.split(',')[1];
          resolve(base64WithoutPrefix);
        } else {
          reject(new Error('Error converting file to base64.'));
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  }

  function createJsonRequest(base64Image: string) {
    return {
      tokenContract: process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
      entropy: entropy,
      base64Image: base64Image,
    };
  }

  const handleSendImage = async () => {
    if (!base64Image) {
      console.error('Image not found');
      return;
    }

    toast({
      title: "Image sent",
      description: "Please wait, the result may take a few minutes to arrive",
      action: (
        <ToastAction altText="Undo sending">Undo</ToastAction>
      ),
    });

    if (imagePreview) {
      setImages((prevImages) => [...prevImages, imagePreview]);
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      try {
        const base64 = await imageToBase64(file);
        setBase64Image(base64);
        setEntropy(entropy + 1);
        const json = createJsonRequest(base64);
        console.log('Image converted to base64:', json);
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
  };

  return (
    <div className="justify-items-center h-screen my-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <p className="font-semibold text-2xl mb-4">Tree Image Detector</p>
      <div className="flex flex-col gap-6">
        {imagePreview && (
          <div className="mt-4 flex flex-col items-center">
            <p className="mb-1 text-lg font-semibold">Image Preview:</p>
            <Image
              src={imagePreview}
              alt="Image preview"
              width={340}
              height={300}
              className="border border-gray-200 rounded-md shadow-sm"
            />
          </div>
        )}

        <input
          className="border border-dashed border-gray-500 py-2 px-3 rounded-md cursor-pointer text-sm"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <Button className="w-[100%] mb-8" onClick={handleSendImage}>
          Send
        </Button>

        {images.length > 0 && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold items-center">Results:</p>
            {[...images].reverse().map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`Image ${index}`}
                width={340}
                height={300}
                className="border border-gray-200 rounded-md shadow-sm my-4"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
