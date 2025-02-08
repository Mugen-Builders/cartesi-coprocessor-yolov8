import web3
import json
import sha3
import logging
import requests
import traceback
from io import BytesIO
from os import environ
from eth_abi import encode, decode
from computer_vision import ImageAnalyzer

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)
rollup_server = environ.get("ROLLUP_HTTP_SERVER_URL") or "http://localhost:5004"
logger.info(f"HTTP rollup server URL is {rollup_server}")

IMAGE_ANALYZER = ImageAnalyzer("./computer_vision/model/best_float32.tflite")


def hex2binary(hexstr):
    return bytes.fromhex(hexstr[2:])


def binary2hex(binary):
    return "0x" + binary.hex()


MINT_FUNCTION_SELECTOR = hex(int.from_bytes(
    web3.Web3().keccak(b"mint(address,uint256)")[:4], 'big'))


def send_notice(notice: dict) -> None:
    response = requests.post(rollup_server + "/notice", json=notice)
    logger.info(
        f"/notice: Received response status {response.status_code} body {response.content} for notice {notice}")


def put_image_keccak256(data: bytes):
    k = sha3.keccak_256()
    k.update(data)

    gio_payload = {"domain": 0x2c, "id": "0x" + data.hex()}
    response = requests.post(rollup_server + "/gio", json=gio_payload)
    if response.status_code == 202:
        logger.info(f"PutImageKeccak256 emitted successfully with data: {data}")
    else:
        logger.error(f"Failed to PutImageKeccak256 with data: {data}. Status code: {response.status_code}")
    return k.hexdigest()


def process_image_and_predict_state(sender, base64_image, token_contract):
    try:
        annotated_image, detections = IMAGE_ANALYZER.process_image(base64_image)
        detectionsLength = len(detections)

        encoded_call = bytes.fromhex(MINT_FUNCTION_SELECTOR[2:]) + encode(["address", "uint256"], [sender, detectionsLength])
        abi_encoded_call = encode(["address", "bytes"], [token_contract, encoded_call])

        buffer = BytesIO()
        annotated_image.save(buffer, format="JPEG")
        jpeg_data = buffer.getvalue()
        
        imageHash = put_image_keccak256(jpeg_data)
        print(f"Image hash: {imageHash}")
        
        send_notice({
            "payload": binary2hex(encode(["bytes32", "bytes"], [bytes.fromhex(imageHash), abi_encoded_call]))
        })
        return detectionsLength
    except Exception as e:
        logger.error(f"Error processing image: {traceback.format_exc()}")
        raise e


def verify_real_world_state(sender, binary) -> bool:
    try:
        decoded_verifier_input = json.loads(binary.decode("utf-8").replace("'", '"'))
        base64_image = decoded_verifier_input.get("base64_image")
        token_contract = decoded_verifier_input.get("token_contract")
        if not base64_image or not token_contract:
            raise ValueError("Missing required fields in verifier input")

        logger.info(f"Token contract: {token_contract}")
        # Process image and return True if one or more objects detected
        return process_image_and_predict_state(sender, base64_image, token_contract) > 0
    except Exception as e:
        logger.error(f"Error {e} verifying real world state: {traceback.format_exc()}")
        return False


def handle_advance(data):
    logger.info(f"Received advance request data {data}.")
    try:
        payload = data["payload"]
        binary = hex2binary(payload)
        (sender, payload) = decode(["address", "bytes"], binary)

        return "accept" if verify_real_world_state(sender, payload) else "reject"
    except Exception as e:
        msg = f"Error {e} processing data {data}"
        logger.error(f"{msg}\n{traceback.format_exc()}")
        return "reject"


handlers = {
    "advance_state": handle_advance,
}

finish = {"status": "accept"}

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code != 202:
        rollup_request = response.json()
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])
