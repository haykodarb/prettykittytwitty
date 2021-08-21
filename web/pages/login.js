import styles from "../styles/Login.module.css";


export default function LoginPage() {
	
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Pretty Kitty Twitty</h1>

			<p className={styles.text}>
				Hiiiiiiii :3 welcome to Pretty Kitty Twitty
				<br />
				In this page you can upload pictures of your favourite kittens and we'll
				<br />
				periodically upload them for you on your Twitter account
			</p>
			<p className={styles.text}>
				You can Login to your Twitter account with the link below
			</p>

			<a href="/twitter" className={styles.link}>
				Login to Twitter
			</a>
		</div>
	);
}
