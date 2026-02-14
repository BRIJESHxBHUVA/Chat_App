import React, { useContext, useEffect, useState } from 'react'
import './Login.css'
import { AppContext } from '../../Context'
import { useDispatch } from 'react-redux';
import { loginUser } from '../../redux/reducers/authReducer';
import { useSelector } from 'react-redux';
import { authActions } from '../../redux/reducers/authReducer';
import { useNavigate } from 'react-router-dom';

const Login = () => {

    const dispatch = useDispatch();
    const router = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);
    const { loginForm, setLoginForm } = useContext(AppContext)
    const [isRegistering, setIsRegistering] = useState(loginForm);
    const [userData, setUserData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        password: "",
        image: null,
    });

    const welcomeMessages = [
        "Connect instantly with friends, family, and colleagues. Fast, secure, and built to make conversations easy.",
        "Chat without limits. Private, secure, and lightning-fast messaging — anytime, anywhere.",
        "Stay close to the people who matter most. Share messages, photos, and moments in one place.",
        "A smarter way to stay connected. Secure conversations and seamless sharing, all in one app."
    ];

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length);
        }, 15000);

        return () => clearInterval(interval);
    }, [welcomeMessages.length]);

    const handleToggle = () => {
        setTimeout(() => {
            setLoginForm(!loginForm);
        }, 450);
        setIsRegistering(!isRegistering);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setUserData((prev) => ({
                ...prev,
                [name]: files[0],
            }))
        } else {
            setUserData((prev) => ({
                ...prev,
                [name]: value,
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const credentials = {
                email: userData.email,
                password: userData.password,
            };

            const resultAction = await dispatch(loginUser(credentials));
            console.log("login res", resultAction);
            if (loginUser.fulfilled.match(resultAction)) {
                router('/dashboard');
            }
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <div className='login_page'>

            <div className="login_box">
                <div className={`welcome_side ${isRegistering ? 'slide-out' : 'slide-in'}`}>
                    <h3 className='welcome_side_heading'>Welcome to Chat App</h3>
                    <p className='welcome_side_text'>{welcomeMessages[currentMessageIndex]}</p>
                    <button className='toggle_form' onClick={handleToggle}>{!isRegistering ? 'Login Form' : 'Register Form'}</button>
                </div>
                <div className={`login_side ${isRegistering ? 'slide-in' : 'slide-out'}`}>
                    <form className='login_form' onSubmit={handleSubmit}>
                        {!loginForm ? <p className='login_side_heading'>Sign Up</p> : <p className='login_side_heading'>Login</p>}
                        {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your first name' name='firstname' />}
                        {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your last name' name='lastname' />}
                        <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your email' name='email' />
                        {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter you phone number' name='phone' />}
                        <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your password' name='password' />
                        {!loginForm && <label htmlFor="image_input" className='image_input'>Select File</label>}
                        {!loginForm && <input type="file" id='image_input' onChange={handleChange} placeholder='Set your Profile Picture' name='image' />}

                        <button className='login' disabled={loading}>{loading ? 'Logging in...' : (!loginForm ? 'Sign Up' : 'Sign In')}</button>

                    </form>
                </div>
            </div>

            <div className='responsive_login_side'>
                <form className='login_form' onSubmit={handleSubmit}>
                    {!loginForm ? <p className='login_side_heading'>Sign Up</p> : <p className='login_side_heading'>Login</p>}
                    {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your first name' name='firstname' />}
                    {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your last name' name='lastname' />}
                    <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your email' name='email' />
                    {!loginForm && <input className='form_input' type="text" onChange={handleChange} placeholder='Enter you phone number' name='phone' />}
                    <input className='form_input' type="text" onChange={handleChange} placeholder='Enter your password' name='password' />
                    {!loginForm && <label htmlFor="image_input" className='image_input'>Select File</label>}
                    {!loginForm && <input type="file" id='image_input' onChange={handleChange} placeholder='Set your Profile Picture' name='image' />}

                    <button className='login' disabled={loading}>{loading ? 'Logging in...' : (!loginForm ? 'Sign Up' : 'Sign In')}</button>
                    {error && <p className="error_text">{error}</p>}
                    {!loginForm && <p className='responsive_toggle_form'>Already have an account? <span className='responsive_toggle_form_button' onClick={handleToggle}>Login here</span></p>}
                    {loginForm && <p className='responsive_toggle_form'>Create a new account? <span className='responsive_toggle_form_button' onClick={handleToggle}>Click here</span></p>}
                </form>
            </div>
        </div>
    )
}

export default Login