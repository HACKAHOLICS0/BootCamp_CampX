{activeTab === 'chat' && (
    <div className="chatroom-placeholder">
        <FaComments size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3>Chat room</h3>
        <p>Accédez au chat pour discuter avec d'autres apprenants</p>
        <button 
            className="btn btn-success" 
            style={{ 
                marginTop: '1rem',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '20px auto'
            }}
            onClick={() => window.location.href = 'http://51.91.251.228:3000/chat'}
        >
            <FaComments /> Accéder au Chat
        </button>
    </div>
)} 