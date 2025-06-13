import React from 'react';
import { LoginForm } from '../components/Form/login';

export function Login() {
    return (
        <div className='min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4'>
            <LoginForm />
        </div>
    );
}