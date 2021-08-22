import React, { useState, useEffect } from "react";
import styles from "./slider.module.css";

export default function SliderShow({ uploaded }) {
	const [images, setImages] = useState(null);

	const getTitle = () => {
		return uploaded ? "Imagenes subidas" : "Imagenes no subidas";
	};

	useEffect(async () => {
		let result = await fetch(
			`/api/images?uploaded=${uploaded}&username=haykodarb`
		);
		let json = await result.json();
		setImages(json.data);
	}, []);

	return (
		<>
			<h1
				style={{
					marginTop: "4%",
				}}
			>
				{getTitle()}
			</h1>
			<div className={styles.container} draggable="false">
				{images != null ? (
					images.map((el) => {
						let src = `data:${el.fileType};base64, ${el.b64content}`;
						return <img src={src} className={styles.image} draggable="false" />;
					})
				) : (
					<p
						style={{
							flex: 1,
							fontSize: "30px",
							textAlign: "center",
						}}
					>
						Cargando gatitos...
					</p>
				)}
			</div>
		</>
	);
}
