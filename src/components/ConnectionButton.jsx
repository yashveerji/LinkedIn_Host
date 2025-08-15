import React, { useContext, useEffect, useState } from 'react'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import io from "socket.io-client"
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'

const socket = io("http://localhost:8000")

function ConnectionButton({ userId }) {
    const { serverUrl } = useContext(authDataContext)
    const { userData } = useContext(userDataContext)
    const [status, setStatus] = useState("")
    const navigate = useNavigate()

    const handleSendConnection = async () => {
        try {
            let result = await axios.post(
                `${serverUrl}/api/connection/send/${userId}`,
                {},
                { withCredentials: true }
            )
            console.log(result)
        } catch (error) {
            console.log(error)
        }
    }

    const handleRemoveConnection = async () => {
        try {
            let result = await axios.delete(
                `${serverUrl}/api/connection/remove/${userId}`,
                { withCredentials: true }
            )
            console.log(result)
        } catch (error) {
            console.log(error)
        }
    }

    const handleGetStatus = async () => {
        try {
            let result = await axios.get(
                `${serverUrl}/api/connection/getStatus/${userId}`,
                { withCredentials: true }
            )
            console.log(result)
            setStatus(result.data.status)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        socket.emit("register", userData._id)
        handleGetStatus()

        socket.on("statusUpdate", ({ updatedUserId, newStatus }) => {
            if (updatedUserId === userId) {
                setStatus(newStatus)
            }
        })

        return () => {
            socket.off("statusUpdate")
        }
    }, [userId])

    const handleClick = async () => {
        if (status === "disconnect") {
            await handleRemoveConnection()
        } else if (status === "received") {
            navigate("/network")
        } else {
            await handleSendConnection()
        }
    }

    const handleViewProfile = () => {
        navigate(`/profile/${userId}`)
    }

    return (
        <div className="flex gap-2 items-center">
            <button
                className="min-w-[100px] h-[40px] rounded-full border-2 border-[#2dc0ff] text-[#2dc0ff]"
                onClick={handleClick}
                disabled={status === "pending"}
            >
                {status}
            </button>

            {/* Extra button to view profile when connected */}
            {status === "connected" && (
                <button
                    className="min-w-[120px] h-[40px] rounded-full border-2 border-green-500 text-green-500"
                    onClick={handleViewProfile}
                >
                    View Profile
                </button>
            )}
        </div>
    )
}

export default ConnectionButton
