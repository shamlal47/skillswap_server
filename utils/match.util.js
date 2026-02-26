/**
 * Finds common skills between two lists
 * @param {Array} listA - First skill list (e.g., skillsOffered)
 * @param {Array} listB - Second skill list (e.g., skillsNeeded)
 * @returns {Array} - Array of common skills
 */
export const getCommonSkills = (listA, listB) => {
    const common = [];
    const normalizedB = listB.map(s => s.toLowerCase());

    for (const skill of listA) {
        if (normalizedB.includes(skill.toLowerCase())) {
            common.push(skill);
        }
    }

    return common;
};
