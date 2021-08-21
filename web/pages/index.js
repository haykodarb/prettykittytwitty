import styles from "../styles/Dashboard.module.css";
import Slider from "../components/Slider/slider.js";
import React, { useState, useEffect } from "react";

export default function IndexPage() {
	const [selectedImage, setSelectedImage] = useState(null);
	const [isFileUploading, setIsFileUploading] = useState(false);
	const [responseMessage, setResponseMessage] = useState(
		"No hay imagen seleccionada."
	);

	function ImageForm() {
		return (
			<>
				<form
					onSubmit={formOnSubmit}
					style={{
						minWidth: "50%",
						height: 100,
						maxWidth: "70%",
						flexGrow: 1,
						display: "flex",
						justifyContent: "start",
						alignItems: "center",
					}}
				>
					<label
						style={{
							width: 150,
							lineHeight: "50px",
							color: "#000000",
							display: "table-cell",
							verticalAlign: "middle",
							cursor: "pointer",
							textAlign: "center",
							color: "#FFFFFF",
							backgroundColor: "#b5838d",
							fontWeight: 600,
							marginRight: 20,
						}}
					>
						Elegir
						<input
							style={{
								display: "none",
							}}
							id="file"
							name="myImage"
							type="file"
							onChange={(event) => setSelectedImage(event.target.files[0])}
						/>
					</label>
					<button
						style={{
							width: 150,
							cursor: "pointer",
							alignSelf: "center",
							justifySelf: "center",
							textAlign: "center",
							border: "none",
							height: 50,
							fontSize: 20,
							backgroundColor: "#b5838d",
							color: "#FFFFFF",
							marginRight: 20,
							fontWeight: 600,
						}}
						type="submit"
					>
						Subir
					</button>
					<p
						style={{
							maxWidth: 400,
							overflow: "hidden",
						}}
					>
						{selectedImage != null ? selectedImage.name : responseMessage}
					</p>
				</form>
				{isFileUploading ? <p>Subiendo...</p> : null}
			</>
		);
	}

	function formOnSubmit(e) {
		e.preventDefault();

		let endpoint = "/api/upload";
		let formData = new FormData();
		if (selectedImage != null) {
			formData.append("myImage", selectedImage);
			setIsFileUploading(true);

			fetch(endpoint, {
				method: "POST",
				body: formData,
			})
				.then((res) => {
					setIsFileUploading(false);
					return res.json();
				})
				.then((json) => {
					setSelectedImage(null);
					setResponseMessage(json.message);
				});
		} else {
			setResponseMessage("No hay imagen seleccionada.");
		}
	}

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Pretty Kitty Twitty</h1>
			<ImageForm />
			<Slider uploaded={false} />
			<Slider uploaded={true} />
		</div>
	);
}
