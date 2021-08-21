import styles from "../styles/Dashboard.module.css";
import Slider from "../components/Slider/slider.js";
import React, { useState, useEffect } from "react";

export default function IndexPage() {
	const [selectedImage, setSelectedImage] = useState(null);
	const [isFileUploading, setIsFileUploading] = useState(false);
	function formOnSubmit(e) {
		e.preventDefault();

		let endpoint = "/api/upload";
		let formData = new FormData();
		formData.append("myImage", selectedImage);
		setIsFileUploading(true);

		fetch(endpoint, {
			method: "POST",
			body: formData,
		}).then((res) => {
			setIsFileUploading(false);
		});
	}

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Pretty Kitty Twitty</h1>
			<form onSubmit={formOnSubmit}>
				<div>
					<div>
						<input
							id="file"
							name="myImage"
							type="file"
							onChange={(event) => setSelectedImage(event.target.files[0])}
						/>
					</div>
					<button type="submit">Enviar</button>
				</div>
			</form>
			{isFileUploading ? <p>Subiendo...</p> : null}
			<Slider uploaded={false} />
			<Slider uploaded={true} />
		</div>
	);
}
