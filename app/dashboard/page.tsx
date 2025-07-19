"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '32px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#333', 
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Admin Dashboard
        </h1>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '24px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            color: '#666', 
            marginBottom: '16px' 
          }}>
            Welcome, Admin!
          </h2>
          
          <p style={{ 
            fontSize: '16px', 
            color: '#888', 
            marginBottom: '32px' 
          }}>
            Manage your fantasy player projections and rankings from here.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '24px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button style={{
              backgroundColor: '#4f81ff',
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              minWidth: '200px'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b6bff'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4f81ff'}
            onClick={() => {
              router.push('/projections/create');
            }}>
              Create Projection
            </button>
            
            <button style={{
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              minWidth: '200px'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#6c757d'}
            onClick={() => {
              // TODO: Navigate to past projections page
              console.log('View Past Projections clicked');
            }}>
              View Past Projections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
