export function calculateHealthScore(issues, lastScore = 100) {
    if (!issues || issues.length === 0) return { score: 100, trend: 'stable', slaCompliance: 100, metadata: {} };

    const now = new Date();
    let totalPenalty = 0;

    const processedIssues = issues.map(issue => {
        const createdAt = new Date(issue.createdAt?.toDate ? issue.createdAt.toDate() : issue.createdAt);
        const hoursOpen = Math.floor((now - createdAt) / (1000 * 60 * 60));
        const severity = (issue.severity || 'medium').toLowerCase();
        const status = (issue.status || 'open').toLowerCase();

        const slaDeadline = issue.slaDeadline?.toDate ? issue.slaDeadline.toDate() : (issue.slaDeadline ? new Date(issue.slaDeadline) : null);
        // An issue is breached if it's explicitly marked OR if it's open and past deadline
        const isCurrentlyBreached = issue.slaStatus === 'breached' || (status !== 'resolved' && slaDeadline && now > slaDeadline);

        const penalties = {
            critical: 40,
            high: 15,
            medium: 5,
            low: 1
        };

        const breachPenalties = {
            critical: 50,
            high: 30,
            medium: 15,
            low: 5
        };

        const basePenalty = penalties[severity] || 5;
        let currentPenalty = 0;

        if (status !== 'resolved') {
            currentPenalty = basePenalty + hoursOpen;
            if (isCurrentlyBreached) {
                currentPenalty += breachPenalties[severity] || 10;
            }
        } else {
            // Gradual Restoration for resolved issues
            const resolvedAt = new Date(issue.resolvedAt?.toDate ? issue.resolvedAt.toDate() : issue.resolvedAt);
            const hoursSinceResolved = Math.floor((now - resolvedAt) / (1000 * 60 * 60));
            const wasBreached = issue.slaStatus === 'breached';

            const initialPenaltyAtResolution = basePenalty + Math.floor((resolvedAt - createdAt) / (1000 * 60 * 60)) + (wasBreached ? (breachPenalties[severity] || 10) : 0);

            // Restoration formula: P * (0.5 ^ (t / 0.166))  --> 10 minute half-life
            // After 10 mins: halved. After 1 hour: 1/64th.
            currentPenalty = initialPenaltyAtResolution * Math.pow(0.5, hoursSinceResolved / 0.166);

            // Cap minimum penalty for resolved issues to allow score to hit 100
            if (currentPenalty < 0.1) currentPenalty = 0;
        }

        return { ...issue, currentPenalty, isCurrentlyBreached };
    });

    totalPenalty = processedIssues.reduce((sum, i) => sum + i.currentPenalty, 0);
    const finalScore = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

    // Compliance = (Total - (Open Breached + Resolved Breached)) / Total
    const breachedCount = issues.filter(i => i.slaStatus === 'breached' || ((i.status || 'open').toLowerCase() !== 'resolved' && i.slaDeadline && now > (i.slaDeadline.toDate ? i.slaDeadline.toDate() : new Date(i.slaDeadline)))).length;
    const slaCompliance = Math.round(((issues.length - breachedCount) / issues.length) * 100);

    let trend = 'stable';
    if (finalScore > lastScore) trend = 'up';
    if (finalScore < lastScore) trend = 'down';

    return {
        score: finalScore,
        trend,
        slaCompliance,
        lastUpdated: now.toISOString(),
        breakdown: {
            openIssues: issues.filter(i => (i.status || 'open').toLowerCase() !== 'resolved').length,
            breachedIssues: breachedCount,
            impact: Math.round(totalPenalty)
        }
    };
}

export function calculateHealthSummary(issues, lastScore = 100) {
    const engineResult = calculateHealthScore(issues, lastScore);

    const total = issues.length;
    const resolved = issues.filter(i => (i.status || 'open').toLowerCase() === 'resolved');
    const resolvedPercentage = total > 0 ? Math.round((resolved.length / total) * 100) : 100;

    const severityBreakdown = {
        low: issues.filter(i => (i.severity || 'medium').toLowerCase() === 'low').length,
        medium: issues.filter(i => (i.severity || 'medium').toLowerCase() === 'medium').length,
        high: issues.filter(i => (i.severity || 'medium').toLowerCase() === 'high').length,
        critical: issues.filter(i => (i.severity || 'medium').toLowerCase() === 'critical').length
    };

    return {
        totalIssues: total,
        resolvedIssues: resolved.length,
        resolvedPercentage,
        slaCompliance: engineResult.slaCompliance,
        score: engineResult.score,
        trend: engineResult.trend,
        severityBreakdown,
        lastUpdated: engineResult.lastUpdated
    };
}
