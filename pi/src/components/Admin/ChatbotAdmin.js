import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import chatService from '../../services/chatService';

const ChatbotAdmin = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeUsers: 0,
    totalMessages: 0
  });

  useEffect(() => {
    fetchAllConversations();
  }, []);

  const fetchAllConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getAllConversations();
      setConversations(response.data);
      updateStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const uniqueUsers = new Set(data.map(conv => conv.userId));
    const totalMessages = data.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0);
    
    setStats({
      totalConversations: data.length,
      activeUsers: uniqueUsers.size,
      totalMessages: totalMessages
    });
  };

  const deleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(conversations.filter(conv => conv._id !== conversationId));
      updateStats(conversations.filter(conv => conv._id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Chatbot Administration</h2>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Conversations</Card.Title>
              <h3>{stats.totalConversations}</h3>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Active Users</Card.Title>
              <h3>{stats.activeUsers}</h3>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Messages</Card.Title>
              <h3>{stats.totalMessages}</h3>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Conversations Table */}
      <Card>
        <Card.Body>
          <Card.Title>Conversations History</Card.Title>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Created At</th>
                  <th>Messages</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation._id}>
                    <td>{conversation.userId}</td>
                    <td>{new Date(conversation.createdAt).toLocaleString()}</td>
                    <td>{conversation.messages?.length || 0}</td>
                    <td>
                      <Badge bg={conversation.active ? "success" : "secondary"}>
                        {conversation.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteConversation(conversation._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ChatbotAdmin;