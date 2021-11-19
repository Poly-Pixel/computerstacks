import CommentStyle from "../styles/Comment.module.css";
import Image from "next/image";
import profile from "../public/profile.png";

function Comment(props) {
	const time = new Date(props.data.timestamp);
	return (
		<div className={CommentStyle.comment}>
			<div className={CommentStyle.inner}>
				<Image
					src={props.data.author.image || profile}
					className={CommentStyle.authorImg}
					width={40}
					height={40}
					alt="Profile picture"
				/>
				<p>{props.data.author.name}</p>
			</div>
			<div className={CommentStyle.inner}>
				<p className={CommentStyle.commentText}>{props.data.content}</p>
				<p className={CommentStyle.timestamp}>
					Sent on {time.toDateString()} at {time.toTimeString()}
				</p>
			</div>
		</div>
	);
}

export default Comment;
