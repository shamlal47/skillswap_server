// Test chat functionality between two users
import axios from 'axios';

const API = 'http://localhost:5000/api';

async function testChat() {
    try {
        console.log('\n=== Testing Chat System ===\n');

        // 1. Create two users
        console.log('1. Creating User A (Alice)...');
        const timestampA = Date.now();
        const regA = await axios.post(`${API}/auth/register`, {
            name: 'Alice Test',
            email: `alice${timestampA}@test.com`,
            password: 'password123'
        });
        const tokenA = regA.data.token;
        // Get user data via /me endpoint
        const meA = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const userA = { data: meA.data.data, token: tokenA };
        console.log('   User A ID:', userA.data._id);

        console.log('\n2. Creating User B (Bob)...');
        const timestampB = Date.now();
        const regB = await axios.post(`${API}/auth/register`, {
            name: 'Bob Test',
            email: `bob${timestampB}@test.com`,
            password: 'password123'
        });
        const tokenB = regB.data.token;
        const meB = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokenB}` } });
        const userB = { data: meB.data.data, token: tokenB };
        console.log('   User B ID:', userB.data._id);

        // 2. Set skills for both users (bidirectional matching)
        console.log('\n3. Setting skills...');
        console.log('   User A: teaches JavaScript, wants Python');
        await axios.put(`${API}/users/${userA.data._id}`, {
            skillsToTeach: ['JavaScript'],
            skillsToLearn: ['Python']
        }, { headers: { Authorization: `Bearer ${userA.token}` } });

        console.log('   User B: teaches Python, wants JavaScript');
        await axios.put(`${API}/users/${userB.data._id}`, {
            skillsToTeach: ['Python'],
            skillsToLearn: ['JavaScript']
        }, { headers: { Authorization: `Bearer ${userB.token}` } });

        // 3. User B creates a course
        console.log('\n4. User B creates a Python course...');
        const courseRes = await axios.post(`${API}/courses`, {
            title: 'Learn Python Basics',
            category: 'Programming',
            description: 'A comprehensive Python course',
            duration: '10 hours',
            requiredSkill: 'JavaScript',
            demovideo: 'https://youtube.com/watch?v=test'
        }, { headers: { Authorization: `Bearer ${userB.token}` } });
        const course = courseRes.data;
        console.log('   Course ID:', course._id);

        // 4. User A sends a chat request
        console.log('\n5. User A sends chat request to User B...');
        const requestRes = await axios.post(`${API}/chat/request`, {
            receiverId: userB.data._id,
            courseId: course._id,
            message: 'I want to learn Python!'
        }, { headers: { Authorization: `Bearer ${userA.token}` } });
        console.log('   ✓ Request sent! Status:', requestRes.data.request.status);

        // 5. User B checks pending requests
        console.log('\n6. User B checks pending requests...');
        const pendingRes = await axios.get(`${API}/chat/requests/pending`, {
            headers: { Authorization: `Bearer ${userB.token}` }
        });
        console.log('   Pending:', pendingRes.data.requests.length);
        if (pendingRes.data.requests.length > 0) {
            console.log('   From:', pendingRes.data.requests[0].sender?.name);
        }

        // 6. User B accepts the request
        console.log('\n7. User B accepts the request...');
        await axios.post(`${API}/chat/request/respond`, {
            requestId: requestRes.data.request._id,
            action: 'accept'
        }, { headers: { Authorization: `Bearer ${userB.token}` } });
        console.log('   ✓ Request accepted!');

        // 7. Exchange messages
        console.log('\n8. Exchanging messages...');
        await axios.post(`${API}/chat/message`, {
            chatRequestId: requestRes.data.request._id,
            content: 'Hello Bob!'
        }, { headers: { Authorization: `Bearer ${userA.token}` } });
        console.log('   Alice: Hello Bob!');

        await axios.post(`${API}/chat/message`, {
            chatRequestId: requestRes.data.request._id,
            content: 'Hi Alice! Welcome!'
        }, { headers: { Authorization: `Bearer ${userB.token}` } });
        console.log('   Bob: Hi Alice! Welcome!');

        // 8. Get all messages
        console.log('\n9. Getting messages...');
        const allMessages = await axios.get(`${API}/chat/chats/${requestRes.data.request._id}/messages`, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('   Total messages:', allMessages.data.messages.length);

        // 9. Check active chats
        console.log('\n10. Checking active chats...');
        const chatsRes = await axios.get(`${API}/chat/chats`, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('   Active chats:', chatsRes.data.chats.length);

        console.log('\n=== ✅ Chat Test Complete ===\n');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

testChat();
