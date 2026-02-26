
const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('--- Starting Matching Test ---');
    const timestamp = Date.now();

    // 1. Register User A (Alice teaches Python, wants to learn JavaScript)
    const userA = { name: 'Alice', email: `alice${timestamp}@example.com`, password: 'password123' };
    const regARes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userA)
    });
    const regAData = await regARes.json();
    console.log('Register Alice:', regAData.success ? 'Success' : `Failed: ${regAData.message || JSON.stringify(regAData)}`);

    // Login to get token
    const loginARes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userA.email, password: userA.password })
    });
    const loginAData = await loginARes.json();
    if (!loginAData.token) {
        console.error('Login Alice failed:', loginAData);
        return;
    }
    const tokenA = loginAData.token;
    const aliceId = parseJwt(tokenA).id;
    console.log('Login Alice: Success, ID:', aliceId);

    // 2. Update Alice skills (NEW FIELD NAMES: skillsToTeach, skillsToLearn)
    const updateARes = await fetch(`${BASE_URL}/users/${aliceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({
            skillsToTeach: ['Python', 'Data Science'],
            skillsToLearn: ['Javascript', 'React']
        })
    });
    const updateAData = await updateARes.json();
    console.log('Update Alice Skills:', updateAData.success ? 'Success' : 'Failed');
    console.log('  Alice teaches:', updateAData.user?.skillsToTeach);
    console.log('  Alice wants to learn:', updateAData.user?.skillsToLearn);

    // 3. Register User B (Bob teaches JavaScript, wants to learn Python - PERFECT MATCH!)
    const userB = { name: 'Bob', email: `bob${timestamp}@example.com`, password: 'password123' };
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userB)
    });
    const regBData = await regBRes.json();
    console.log('Register Bob:', regBData.success ? 'Success' : `Failed: ${regBData.message || JSON.stringify(regBData)}`);

    // Login Bob
    const loginBRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userB.email, password: userB.password })
    });
    const loginBData = await loginBRes.json();
    if (!loginBData.token) {
        console.error('Login Bob failed:', loginBData);
        return;
    }
    const tokenB = loginBData.token;
    const bobId = parseJwt(tokenB).id;
    console.log('Login Bob: Success, ID:', bobId);

    // Update Bob skills (complementary to Alice)
    const updateBRes = await fetch(`${BASE_URL}/users/${bobId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenB}`
        },
        body: JSON.stringify({
            skillsToTeach: ['Javascript', 'React'],
            skillsToLearn: ['Python', 'Machine Learning']
        })
    });
    const updateBData = await updateBRes.json();
    console.log('Update Bob Skills:', updateBData.success ? 'Success' : 'Failed');
    console.log('  Bob teaches:', updateBData.user?.skillsToTeach);
    console.log('  Bob wants to learn:', updateBData.user?.skillsToLearn);

    // 4. Register User C (Charlie - NO MATCH with Alice, only one direction)
    const userC = { name: 'Charlie', email: `charlie${timestamp}@example.com`, password: 'password123' };
    const regCRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userC)
    });
    await regCRes.json();

    const loginCRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userC.email, password: userC.password })
    });
    const loginCData = await loginCRes.json();
    const tokenC = loginCData.token;
    const charlieId = parseJwt(tokenC).id;
    console.log('Login Charlie: Success, ID:', charlieId);

    // Charlie teaches Python but wants to learn Go (Alice doesn't teach Go, so NO MATCH)
    await fetch(`${BASE_URL}/users/${charlieId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenC}`
        },
        body: JSON.stringify({
            skillsToTeach: ['Python'],
            skillsToLearn: ['Go', 'Rust']
        })
    });
    console.log('Update Charlie Skills: teaches Python, wants Go/Rust (should NOT match Alice)');

    // 5. Create Courses for testing matched courses
    const courses = [
        {
            title: `Python Basics ${timestamp}`,
            description: 'Learn Python from scratch.',
            demovideo: 'http://example.com/python.mp4',
            duration: '10 hours',
            category: 'Programming',
            requiredSkill: 'Python'
        },
        {
            title: `JavaScript Essentials ${timestamp}`,
            description: 'Master modern JavaScript.',
            demovideo: 'http://example.com/js.mp4',
            duration: '15 hours',
            category: 'Web Development',
            requiredSkill: 'Javascript'
        },
        {
            title: `React Fundamentals ${timestamp}`,
            description: 'Build React applications.',
            demovideo: 'http://example.com/react.mp4',
            duration: '12 hours',
            category: 'Web Development',
            requiredSkill: 'React'
        }
    ];

    for (const course of courses) {
        const cRes = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify(course)
        });
        const cData = await cRes.json();
        console.log(`Created Course: ${cData.title}`);
    }

    // 6. Test Find Matches for Alice (NEW ENDPOINT)
    console.log('\n--- Testing Find Matches for Alice ---');
    const matchRes = await fetch(`${BASE_URL}/courses/find-matches`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenA}`
        }
    });
    const matchData = await matchRes.json();
    console.log('Find Matches Result:');
    console.log('  Success:', matchData.success);
    console.log('  Total Matches:', matchData.matches?.length || 0);

    if (matchData.matches?.length > 0) {
        for (const match of matchData.matches) {
            console.log(`\n  Match with: ${match.user.name}`);
            console.log(`    They can teach you: ${match.skillsTheyCanTeachYou?.join(', ')}`);
            console.log(`    You can teach them: ${match.skillsYouCanTeachThem?.join(', ')}`);
        }
    }

    // Verify: Alice should match with Bob but NOT Charlie
    const matchedNames = matchData.matches?.map(m => m.user.name) || [];
    console.log('\n  EXPECTED: Bob should be in matches, Charlie should NOT');
    console.log(`  RESULT: Bob matched = ${matchedNames.includes('Bob')}, Charlie matched = ${matchedNames.includes('Charlie')}`);
    if (matchedNames.includes('Bob') && !matchedNames.includes('Charlie')) {
        console.log('  ✓ PASS: Bidirectional matching works correctly!');
    } else {
        console.log('  ✗ FAIL: Matching logic issue');
    }

    // 7. Test Matched Courses for Alice
    console.log('\n--- Testing Matched Courses for Alice ---');
    const matchedCoursesRes = await fetch(`${BASE_URL}/courses/matches`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenA}`
        }
    });
    const matchedCoursesData = await matchedCoursesRes.json();
    console.log('Matched Courses Result:');
    console.log('  Success:', matchedCoursesData.success);
    console.log('  Total Courses:', matchedCoursesData.courses?.length || 0);

    // Alice wants to learn JavaScript and React, so she should see those courses
    const courseTitles = matchedCoursesData.courses?.map(c => c.title) || [];
    console.log('  Courses found:', courseTitles.join(', '));
    console.log('\n  EXPECTED: Should see JavaScript and React courses (Alice wants to learn these)');
    const hasJsCourse = courseTitles.some(t => t.toLowerCase().includes('javascript'));
    const hasReactCourse = courseTitles.some(t => t.toLowerCase().includes('react'));
    console.log(`  RESULT: JavaScript course = ${hasJsCourse}, React course = ${hasReactCourse}`);
    if (hasJsCourse && hasReactCourse) {
        console.log('  ✓ PASS: Matched courses returns courses based on skillsToLearn!');
    } else {
        console.log('  ✗ FAIL: Matched courses not working correctly');
    }

    console.log('\n--- Test Completed ---');
}

function parseJwt(token) {
    try {
        if (!token) return null;
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

runTest().catch(err => console.error('Error:', err));
