import React, { useMemo } from 'react';

const GroupTags = ({ subjects }) => {
    const allGroups = useMemo(() => {
        const groupSet = new Set();
        subjects.forEach(subject => {
            subject.groups.forEach(group => {
                groupSet.add(group.group_name);
            });
        });
        return Array.from(groupSet).sort();
    }, [subjects]);

    return (
        <div className="all-groups-tags">
            {allGroups.map(groupName => (
                <span key={groupName} className="tag">{groupName}</span>
            ))}
        </div>
    );
};

export default GroupTags;