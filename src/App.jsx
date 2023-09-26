import { useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	Container,
	HStack,
	Input,
	VStack,
} from "@chakra-ui/react";
import Message from "./components/Message";
import { app } from "./Config/Firebase";
import {
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
	getAuth,
	signOut,
} from "firebase/auth";
import {
	getFirestore,
	addDoc,
	collection,
	serverTimestamp,
	getDocs,
	onSnapshot,
	query,
	orderBy,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
	const googleProvider = new GoogleAuthProvider();
	signInWithPopup(auth, googleProvider);
};
const logoutHandler = () => signOut(auth);

const App = () => {
	const [user, setuser] = useState(false);
	const [input, setinput] = useState("");
	const [msgData, setmsgData] = useState([]);
	const messageCollectionRef = collection(db, "Messages");
	const q = query(messageCollectionRef, orderBy("createdAt", "asc"));
	const divForScroll = useRef(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (data) => {
			setuser(data);
		});
		const unsubscribeMessage = onSnapshot(q, (snap) => {
			setmsgData(
				snap.docs.map((value) => {
					const id = value.id;
					return { id, ...value.data() };
				})
			);
		});
		return () => {
			unsubscribe();
			unsubscribeMessage();
		};
	}, []);

	// Normal way of fetching data from firebase
	// const fetchData = async () => {
	// 	const data = await getDocs(messageCollectionRef);
	// 	const filteredData = data.docs.map((value) => ({
	// 		...value.data(),
	// 		id: value.id,
	// 	}));
	// 	setmsgData(filteredData);
	// };

	const submitHandler = async (e) => {
		e.preventDefault();
		try {
			await addDoc(messageCollectionRef, {
				text: input,
				uid: user.uid,
				uri: user.photoURL,
				createdAt: serverTimestamp(),
			});
			setinput("");
			divForScroll.current.scrollIntoView({ behavior: "smooth" });
		} catch (error) {
			alert(error);
		}
	};

	return (
		<Box bg={"red.100"}>
			{user ? (
				<Container bg={"white"} h={"100vh"}>
					<VStack h={"full"} py={4}>
						<Button w={"full"} colorScheme="red" onClick={logoutHandler}>
							Log out
						</Button>

						<VStack
							w={"full"}
							h={"full"}
							overflowY={"auto"}
							css={{
								"&::-webkit-scrollbar": {
									display: "none",
								},
							}}
						>
							{msgData.map((value) => (
								<Message
									key={value.id}
									text={value.text}
									uri={value.uri}
									user={value.uid === user.uid ? "me" : "other"}
								/>
							))}
							<div ref={divForScroll}></div>
						</VStack>

						<form style={{ width: "100%" }} onSubmit={submitHandler}>
							<HStack>
								<Input
									bg={"white"}
									placeholder="Enter message.."
									value={input}
									onChange={(e) => setinput(e.target.value)}
								/>
								<Button colorScheme="purple" type="submit">
									Send
								</Button>
							</HStack>
						</form>
					</VStack>
				</Container>
			) : (
				<VStack bg={"white"} justifyContent={"center"} h={"100vh"}>
					<Button colorScheme="purple" onClick={loginHandler}>
						Sign in with google
					</Button>
				</VStack>
			)}
		</Box>
	);
};

export default App;
