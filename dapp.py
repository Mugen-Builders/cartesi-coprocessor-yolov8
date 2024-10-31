import logging
import requests
import json
import base64
import traceback
from enum import Enum
from io import BytesIO
from os import environ
from computer_vision import ImageAnalyzer

# Set up logging
logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

# Constants
rollup_server = environ.get("ROLLUP_HTTP_SERVER_URL")
logger.info(f"HTTP rollup server URL is {rollup_server}")

COPROCESSOR_ADDRESS = "0x000000000000000000000000000000000000000".lower()

# Enum for state
class RealWorldState(Enum):
    SENSORS_NON_COMPLIANT = 0
    SENSORS_COMPLIANT = 1

# Initialize components
IMAGE_ANALYZER = ImageAnalyzer("./computer_vision/model/best_float32.tflite")
STATE = RealWorldState.SENSORS_NON_COMPLIANT

# Helper functions
def str2hex(string):
    """Encode a string as a hex string"""
    return "0x" + string.encode("utf-8").hex()

def hex2binary(hexstr):
    """Decode a hex string into a byte string"""
    return bytes.fromhex(hexstr[2:])

def hex2str(hexstr):
    """Decode a hex string into a regular string"""
    return hex2binary(hexstr).decode("utf-8")

def send_notice(notice: dict) -> None:
    response = requests.post(rollup_server + "/notice", json=notice)
    logger.info(f"/notice: Received response status {response.status_code} body {response.content}")

def process_image_and_predict_state(real_world_data):
    buffer = BytesIO()
    annotated_image, detections = IMAGE_ANALYZER.process_image(real_world_data["base64_image"])
    out = len(detections)
    annotated_image.save(buffer, format="JPEG")
    annotated_image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    send_notice({"payload": str2hex(annotated_image_base64)})
    return out

def verify_real_world_state(binary) -> bool:
    global STATE
    try:
        decoded_verifier_input = decode_verifier_input(binary)
        real_world_data = json.loads(decoded_verifier_input["real_world_data"].replace("'", '"'))

        if verify_signature(decoded_verifier_input):
            out = process_image_and_predict_state(real_world_data)
            STATE = RealWorldState.SENSORS_COMPLIANT if out > 0 else RealWorldState.SENSORS_NON_COMPLIANT
            logger.info(f"State updated to {STATE}")
            return out > 0
        return False

    except Exception as e:
        logger.error(f"Error {e} verifying real world state: {traceback.format_exc()}")
        return False

# Handlers for processing requests
def handle_advance(data):
    logger.info(f"Received advance request data {data}.")
    try:
        payload = data["payload"]
        binary = hex2binary(payload)
        sender = data["metadata"]["msg_sender"]

        if sender == COPROCESSOR_ADDRESS:
            return "accept" if verify_real_world_state(binary) else "reject"
        else:
            logger.info(f"Sender {sender} is not the coprocessor address {COPROCESSOR_ADDRESS}")
            return "accept"

    except Exception as e:
        msg = f"Error {e} processing data {data}"
        logger.error(f"{msg}\n{traceback.format_exc()}")
        send_notice({"payload": str2hex(msg)})
        return "reject"

def handle_inspect(data):
    global STATE
    logger.info(f"Received inspect request data {data}")
    try:
        data_decoded = hex2str(data["payload"])
        if data_decoded == "status":
            send_notice({"payload": str2hex(STATE.name)})
            return "accept"
        else:
            raise ValueError(f"Unknown payload {data['payload']}, send 'status' to get current state")

    except Exception as e:
        logger.error(f"Error {e} during inspect")
        return "reject"

# Main loop
handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
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
