import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PostProperty from './pages/PostProperty'
import PropertyDetails from './pages/PropertyDetails'
import RoomDetails from './pages/RoomDetails'
import Profile from './pages/Profile'
import AdminProperties from './pages/AdminProperties'
import PropertyRooms from './pages/PropertyRooms'
import ManageUsers from './pages/ManageUsers'
import PreApproval from './pages/PreApproval'
import PreApprovalList from './pages/PreApprovalList'
import MyListings from './pages/MyListings'
import UserProfile from './pages/UserProfile'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/register',
        element: <Register />
      },
      {
        path: '/post-property',
        element: <PostProperty />
      },
      {
        path: '/property/:id',
        element: <PropertyDetails />
      },
      {
        path: '/room/:id',
        element: <RoomDetails />
      },
      {
        path: '/profile',
        element: <Profile />
      },
      {
        path: '/admin/properties',
        element: <AdminProperties />
      },
      {
        path: '/admin/properties/:propertyId/rooms',
        element: <PropertyRooms />
      },
      {
        path: '/admin/users',
        element: <ManageUsers />
      },
      {
        path: '/pre-approval',
        element: <PreApproval />
      },
      {
        path: '/pre-approvals',
        element: <PreApprovalList />
      },
      {
        path: '/my-listings',
        element: <MyListings />
      },
      {
        path: '/user/:id',
        element: <UserProfile />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
