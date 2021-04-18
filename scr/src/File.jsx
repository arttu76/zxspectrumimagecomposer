import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { setFileName, loadFile } from "./store";

export const File = (props) => {
	const dispatch = useDispatch();
	const name = useSelector((state) => state.fileName);
	const data = useSelector((state) => state.fileData);

	return (
		<div>
			<input
				type="text"
				value={name}
				onChange={(e) => dispatch(setFileName(e.target.value))}
			/>{" "}
			({name ? name.substr(0, 20) + "..." : "Enter name"})
			<br />
			<button type="text" onClick={() => dispatch(loadFile(props.layer))}>
				Load
			</button>
			<hr />
			.. data: {JSON.stringify(data)}
		</div>
	);
};
