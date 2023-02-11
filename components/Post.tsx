import {useState, useEffect} from "react";
import axios from "axios";

export default function Post(props: {
    post: {
        body: string,
        _id: string,
        createdAt: string,
        user: {
            name: string,
            image: string
        }
    },
    thisUser: {
        _id: string,
        name: string,
        image: string,
    } | null,
}) {
    const [comments, setComments] = useState<{
        _id: string,
        body: string,
        user: {
            name: string,
            image: string,
            _id: string,
        }
    }[]>([]);

    const [newComment, setNewComment] = useState("");

    function onAdd() {
        axios.post("/api/comment", {
            body: newComment,
            postId: props.post._id,
        }).then(res => {
            setNewComment("");
            onRequest();
        }).catch(e => console.log(e));
    }

    function onDelete(id: string) {
        axios.delete("/api/comment", {
            data: {
                id: id,
            }
        }).then(res => {
            onRequest();
        }).catch(e => console.log(e));
    }

    function onRequest() {
        axios.get("/api/comment", {
            params: {
                postId: props.post._id,
            }
        }).then(res => {
            setComments(res.data.comments);
        }).catch(e => console.log(e));
    }

    useEffect(() => {
        onRequest();
    }, []);


    return (
        <div key={props.post._id} className="p-2 border shadow-md m-4">
            <p>{props.post.body}</p>
            <div className="flex items-center mt-2">
                <img src={props.post.user.image} alt="" className="w-4 h-4 rounded-full mr-2" />
                <p className="text-sm text-gray-500">Posted by {props.post.user.name}</p>
            </div>
            <hr className="my-4"/>
            {props.thisUser && (
                <div className="mt-2 text-xs">
                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="border mr-2 p-1" placeholder="Type your comment here"/>
                    <button onClick={onAdd} className="bg-gray-200 p-1">Post comment</button>
                </div>
            )}
            {comments.map(d => (
                <div key={d._id} className="text-sm mt-4">
                    <div className="flex">
                        <p className="mr-2 text-gray-500">Samson Zhang:</p>
                        <p className="mr-2">{d.body}</p>
                        {props.thisUser && props.thisUser._id === d.user._id && (
                            <button onClick={() => onDelete(d._id)} className="text-red-700">Delete</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}