import styles from "../styles/Dashboard.module.css";
import Slider from '../components/Slider/slider.js'

export default function LoginPage() {
	

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Pretty Kitty Twitty</h1>
            <Slider uploaded={false}/>
            <Slider uploaded={true}/>
		</div>
	);
}
