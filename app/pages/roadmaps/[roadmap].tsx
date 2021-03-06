import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import Loading from '../../components/loading';
import Share from '../../components/share';

import HeadStyles from '../../styles/Head.module.css';
import CommentStyle from '../../styles/Comment.module.css';
import Comment from '../../components/comment';

import notroadmap from '../../public/notfavorite.svg';
import profile from '../../public/profile.png';
import roadmap from '../../public/favorite.svg';
import shareIcon from '../../public/share.png';

import roadmapsMeta from '../../functions/roadmapsMeta';
import roadmapsRoadmap from '../../functions/roadmapsRoadmap';

import { ChangeEvent } from 'react';
import { GetStaticProps } from 'next';
import { Roadmap } from '../../interfaces/db/Roadmap';

interface RoadmapProps {
	data: Roadmap
}

function Roadmap(props: RoadmapProps) {
	const router = useRouter();
	const { data: session, status } = useSession();

	const [isRoadmap, setIsRoadmap] = useState(false);
	const [comment, setComment] = useState('');
	const [comments, setComments] = useState(props?.data?.comments);
	const [isShare, setIsShare] = useState(false);

	useEffect(() => {
		if (status !== 'authenticated') return;

		if(!router.query.roadmap || typeof router.query.roadmap === 'object') {
			throw new Error(`Invalid roadmap URI ${router.query.roadmap}`);
		}

		if (session.user.roadmaps.includes(router.query.roadmap))
			setIsRoadmap(true);
	}, [session?.user.roadmaps, status, router.query.roadmap]);

	useEffect(() => {
		setComments(props?.data?.comments);
	}, [props?.data?.comments]);

	if (router.isFallback) return <Loading />;

	function handleRoadmap() {
		if (status !== 'authenticated') {
			alert('You must be logged in to favorite something');
			return;
		}
		const ROADMAP_URL = `/api/user/roadmap`;

		if (isRoadmap) {
			axios
				.post(ROADMAP_URL, {
					uri: router.query.roadmap,
				})
				.then(() => {
					setIsRoadmap(false);
				});
		} else {
			axios
				.post(ROADMAP_URL, {
					uri: router.query.roadmap,
				})
				.then(() => {
					setIsRoadmap(true);
				});
		}
	}

	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		const target = event.target;
		const value = target.value;
		const name = target.name;

		if (name === 'comment') setComment(value);
	}

	function handleComment() {
		if (status !== 'authenticated') {
			alert('You must be logged in to comment');
			return;
		}
		const ROADMAPS_COMMENT_URL = `/api/roadmaps/comment`;

		axios
			.post(ROADMAPS_COMMENT_URL, {
				uri: router.query.roadmap,
				content: comment,
			})
			.then(reloadComments);

		setComment('');
	}

	async function reloadComments() {
		const ROADMAP_URL = `/api/roadmaps/roadmap?uri=${router.query.roadmap}`;

		const res = await axios.get(ROADMAP_URL);

		setComments(res?.data?.comments);
	}

	function listComments() {
		if (!comments) return null;
		return comments.map((comment) => (
			<Comment key={comment._id} data={comment} />
		));
	}

	function handleShare() {
		if (isShare) {
			setIsShare(false);
		} else {
			setIsShare(true);
		}
	}

	return (
		<main>
			<section className={HeadStyles.head}>
				<h2>{props.data.name}</h2>
				<p>{props.data.description}</p>
				<div className={HeadStyles.actionDiv}>
					<div style={{ position: 'relative' }}>
						<Image
							onClick={handleShare}
							src={shareIcon}
							alt="Share Icon"
							width={50}
							height={50}
						/>
						{isShare ? (
							<Share name={props.data.name} toggle={handleShare} />
						) : null}
					</div>
					<Image
						onClick={handleRoadmap}
						src={isRoadmap ? roadmap : notroadmap}
						alt="Favorite button"
						width={75}
						height={75}
					/>
				</div>
			</section>
			<section className="section1">
				<h2>Roadmap</h2>
				<Image src={props.data.image} alt="The roadmap" />
			</section>
			<section className="section2">
				<h2>Comments</h2>
				<div className={CommentStyle.newCommentBox}>
					<Image
						src={session?.user?.image || profile}
						className={CommentStyle.authorImg}
						width={40}
						height={40}
						alt="Profile picture"
					/>
					<textarea name="comment" value={comment} onChange={handleChange} />
					<button onClick={handleComment}>Comment</button>
				</div>
				<div className={CommentStyle.commentDiv}>{listComments()}</div>
			</section>
		</main>
	);
}

async function getStaticPaths() {
	const res = { paths: new Array<{ params: { roadmap: string }}>(), fallback: true };

	const data = await roadmapsMeta();

	if (!data) return res;

	for (const level of data.roadmaps) {
		for (const roadmap of level)
			res.paths.push({ params: { roadmap: roadmap.uri } });
	}

	return res;
}

const  getStaticProps: GetStaticProps = async ({ params }) => {
	const res = { revalidate: 43200, props: { data: {}, error: false } };

	if(!params) {
		throw Error("Category page parameters not found");
	}

	if(!params.roadmap || typeof params.roadmap === 'object') {
		throw Error(`Invalid roadmap URI ${params.roadmap}`);
	}

	const data = await roadmapsRoadmap(params.roadmap);

	if (!data) res.props.error = true;
	else res.props.data = data;

	return res;
}

export { getStaticPaths, getStaticProps };

export default Roadmap;
