// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {ICoprocessorCallback, ICoprocessorOutputs} from "../ICoprocessorCallback.sol";
import {ICoprocessor} from "../ICoprocessor.sol";
import {LibError} from "../library/LibError.sol";
import {IInputBox} from "./IInputBox.sol";

contract CoprocessorCallerMock is ICoprocessorCallback {
    using LibError for bytes;

    address public applicationAddress;
    address public inputBoxAddress;
    ICoprocessor public coprocessor;
    bytes32 public machineHash;

    event ResultReceived(bytes output);

    error InvalidOutput();

    constructor(
        address _applicationAddress,
        address _inputBoxAddress,
        address _coprocessorAddress,
        bytes32 _machineHash
    ) {
        applicationAddress = _applicationAddress;
        inputBoxAddress = _inputBoxAddress;
        coprocessor = ICoprocessor(_coprocessorAddress);
        machineHash = _machineHash;
    }

    function callCoprocessor(bytes calldata input) external {
        IInputBox inputBox = IInputBox(inputBoxAddress);
        inputBox.addInput(applicationAddress, input);
    }

    function handleNotice(bytes calldata notice) public {
        bytes memory payload = abi.decode(notice, (bytes));

        address destination;
        bytes memory decodedPayload;

        (destination, decodedPayload) = abi.decode(payload, (address, bytes));

        bool success;
        bytes memory returndata;

        (success, returndata) = destination.call(decodedPayload);

        if (!success) {
            returndata.raise();
        }

        emit ResultReceived(decodedPayload);
    }

    function coprocessorCallbackOutputsOnly(
        bytes32 _machineHash,
        bytes32 _payloadHash,
        bytes[] calldata outputs
    ) external override {
        for (uint256 i = 0; i < outputs.length; i++) {
            bytes calldata output = outputs[i];

            require(output.length > 3, "Too short output");
            bytes4 selector = bytes4(output[:4]);
            bytes calldata arguments = output[4:];

            require(selector == ICoprocessorOutputs.Notice.selector);

            handleNotice(arguments);
        }
    }
}
