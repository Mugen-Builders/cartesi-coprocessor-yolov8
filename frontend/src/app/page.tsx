"use client";

import { ChangeEvent, useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "wagmi";
import { writeContract, watchContractEvent } from "@wagmi/core";
import { toHex, keccak256, decodeEventLog, encodeAbiParameters } from "viem";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CustomConnectButton } from "@/components/ConnectButton";
import { config } from "@/lib/wagmiConfig";
import { TreeDetectorABI } from "../lib/abi";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const pendingHashesRef = useRef<Set<string>>(new Set());

  const imageToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64WithoutPrefix = reader.result.split(",")[1];
          resolve(base64WithoutPrefix);
        } else {
          reject(new Error("Error converting file to base64."));
        }
      };
      reader.onerror = (error) => reject(error);
    });

  useEffect(() => {
    const unwatch = watchContractEvent(config, {
      abi: TreeDetectorABI,
      address: process.env.NEXT_PUBLIC_COPROCESSOR_ADAPTER as `0x${string}`,
      eventName: "ResultReceived",
      onLogs(logs) {
        logs.forEach((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: TreeDetectorABI,
              eventName: "ResultReceived",
              data: log.data,
              topics: log.topics,
            });
            if (
              typeof decodedLog.args !== "object" ||
              decodedLog.args === null
            ) {
              console.error(
                "Decoded event missing valid arguments:",
                decodedLog.args
              );
              return;
            }

            const { payloadHash: receivedPayloadHash, imageHash } =
              decodedLog.args as unknown as {
                payloadHash: string;
                imageHash: string;
              };

            if (
              typeof receivedPayloadHash !== "string" ||
              typeof imageHash !== "string"
            ) {
              console.error(
                "Invalid values for payloadHash or imageHash:",
                decodedLog.args
              );
              return;
            }
            const normalizedHash = receivedPayloadHash.toLowerCase();
            if (!pendingHashesRef.current.has(normalizedHash)) {
              console.error(
                "Received hash not found in pending list:",
                normalizedHash
              );
              return;
            }
            const normalizedImageHash = imageHash.slice(2);
            axios
              .get(
                `http://127.0.0.1:3034/get_preimage/2/${normalizedImageHash}`
              )
              .then((response) => {
                const imageUrl = response.data.imageUrl;
                if (imageUrl) {
                  setImages((prevImages) => [...prevImages, imageUrl]);
                } else {
                  console.error("Invalid API response:", response.data);
                  toast({
                    title: "Error",
                    description: "Invalid API response.",
                    variant: "destructive",
                    duration: 5000,
                  });
                }
              })
              .catch((err) => {
                console.error("Error fetching image:", err);
                toast({
                  title: "Error fetching image",
                  description:
                    "There was an error fetching the processed image.",
                  variant: "destructive",
                  duration: 5000,
                });
              });
            pendingHashesRef.current.delete(normalizedHash);
            console.log("Received imageHash:", imageHash);
          } catch (error) {
            console.error("Error decoding event:", error);
            toast({
              title: "Error decoding event",
              description:
                "An error occurred while decoding the contract event.",
              variant: "destructive",
              duration: 5000,
            });
          }
        });
      },
    });
    return () => {
      unwatch();
    };
  }, []);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      try {
        const base64 = await imageToBase64(file);
        setBase64Image(base64);
      } catch (error) {
        console.error("Error converting image:", error);
        toast({
          title: "Conversion Error",
          description: "There was an error converting the image.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  const createJsonRequest = () => ({
    token_contract: process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
    entropy: uuidv4(),
    base64_image: base64Image,
  });

  const sendTransaction = async () => {
    const jsonData = createJsonRequest();
    const jsonStr = JSON.stringify(jsonData);
    const hexData = toHex(jsonStr);
    console.log("Hex Data:", hexData);
    if (!address) {
      throw new Error("Wallet address is undefined");
    }
    const encodedPayload = encodeAbiParameters(
      [{ type: "address" }, { type: "bytes" }],
      [address as `0x${string}`, hexData]
    );
    const encodedPayloadHash = keccak256(encodedPayload);
    console.log("Encoded Payload Hash:", encodedPayloadHash);
    pendingHashesRef.current.add(encodedPayloadHash.toLowerCase());
    try {
      await writeContract(config, {
        address: process.env.NEXT_PUBLIC_COPROCESSOR_ADAPTER as `0x${string}`,
        abi: TreeDetectorABI,
        functionName: "runExecution",
        args: [hexData],
      });
      toast({
        title: "Input sent",
        description: "Please wait, the response might take a few minutes.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Error",
        description:
          error instanceof Error ? error.message : "Transaction error",
        variant: "destructive",
        duration: 5000,
      });
      pendingHashesRef.current.delete(encodedPayloadHash.toLowerCase());
    }
  };

  const handleSendImage = async () => {
    if (!base64Image) {
      console.error("Image not found");
      toast({
        title: "Error",
        description: "Image not found.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before sending a transaction.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    try {
      setIsSending(true);
      await sendTransaction();
    } catch (error) {
      console.error("Error sending image:", error);
      toast({
        title: "Error sending image",
        description:
          error instanceof Error ? error.message : "Error sending image",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-screen">
      <div className="flex p-4 justify-end">
        <div className="flex flex-col gap-2 items-center">
          <CustomConnectButton />
          <p>
            Get test tokens on the faucet{" "}
            <Link
              className="underline"
              href="https://cloud.google.com/application/web3/faucet/ethereum/holesky"
            >
              here
            </Link>
          </p>
        </div>
      </div>
      <div className="justify-items-center my-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
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
          <Button
            disabled={isSending}
            className="w-full mb-8"
            onClick={handleSendImage}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
          {images.length > 0 && (
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold">Results:</p>
              {[...images].reverse().map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Result ${index}`}
                  width={340}
                  height={300}
                  className="border border-gray-200 rounded-md shadow-sm my-4"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
