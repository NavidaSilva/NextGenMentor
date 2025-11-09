import { Card, CardContent, Typography, Stack, Avatar } from '@mui/material';
import { InsertDriveFile, VideoCall, Chat, NoteAlt } from '@mui/icons-material';
import React from "react";

const activityIcons = {
    file: <InsertDriveFile sx={{ color: '#5fcf80'}} />,
    video: <VideoCall sx={{ color: '#5fcf80' }} />,
    chat: <Chat sx={{ color: '#5fcf80'}} />,
    note: <NoteAlt sx={{ color: '#5fcf80'}} />
};

const RecentActivity = ({ activities }) => {
    return (
        <Stack spacing={2}>
            {activities.map((activity, index) => (
                <Card key={index} variant="outlined">
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar>
                                {activityIcons[activity.type]}
                            </Avatar>
                            <Stack spacing={0.5}>
                                <Typography variant="subtitle1">{activity.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {activity.date}
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
};

export default RecentActivity;
