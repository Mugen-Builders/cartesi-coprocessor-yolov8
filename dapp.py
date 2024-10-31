import json
import base64
import logging
import requests
import traceback
from enum import Enum
from io import BytesIO
from os import environ
from eth_abi import encode 
from computer_vision import ImageAnalyzer

# Set up logging
logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

# Constants
rollup_server = environ.get("ROLLUP_HTTP_SERVER_URL")
logger.info(f"HTTP rollup server URL is {rollup_server}")

IMAGE_ANALYZER = ImageAnalyzer("./computer_vision/model/best_float32.tflite")

def str2hex(string):
    """Encode a string as a hex string"""
    return "0x" + string.encode("utf-8").hex()

def hex2binary(hexstr):
    """Decode a hex string into a byte string"""
    return bytes.fromhex(hexstr[2:])

def hex2str(hexstr):
    """Decode a hex string into a regular string"""
    return hex2binary(hexstr).decode("utf-8")

def binary2hex(binary):
    """
    Encode a binary as an hex string
    """
    return "0x" + binary.hex()

def send_notice(notice: dict) -> None:
    response = requests.post(rollup_server + "/notice", json=notice)
    logger.info(f"/notice: Received response status {response.status_code} body {response.content}")
    
def decode_verifier_input(binary):
    try:
        verifier_data = {
            "real_world_data": binary.decode("utf-8"),
        }
        return verifier_data
    except Exception as e:
        msg = f"Error {e} decoding input {binary}"
        logger.error(f"{msg}\n{traceback.format_exc()}")
        raise Exception(msg)

def process_image_and_predict_state(real_world_data):
    _, detections = IMAGE_ANALYZER.process_image(real_world_data["base64_image"])
    out = len(detections)
    send_notice({"payload": binary2hex(encode(["uint256"], [out]))})
    return out

def verify_real_world_state(binary) -> bool:
    try:
        decoded_verifier_input = decode_verifier_input(binary)
        print(decoded_verifier_input["real_world_data"]) 
        real_world_data = json.loads(decoded_verifier_input["real_world_data"].replace("'", '"'))
        return True if process_image_and_predict_state(real_world_data) > 0 else False

    except Exception as e:
        logger.error(f"Error {e} verifying real world state: {traceback.format_exc()}")
        return False

def handle_advance(data):
    logger.info(f"Received advance request data {data}.")
    try:
        payload = data["payload"]
        binary = hex2binary(payload)
        sender = data["metadata"]["msg_sender"]
        return "accept" if verify_real_world_state(binary) else "reject"

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