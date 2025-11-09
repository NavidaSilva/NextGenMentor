import { Card, CardContent, Typography,  Avatar, Stack } from '@mui/material';
import { VideoCall, Chat, CalendarToday } from '@mui/icons-material';
import CustomButton from "../../Components/Common/Button";

const SessionCard = ({ session }) => {
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{session.with.charAt(0)}</Avatar>
                    <div>
                        <Typography variant="subtitle1">{session.with}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {session.topic}
                        </Typography>
                    </div>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {session.type === "Video Call" ? (
                        <VideoCall color="primary" />
                    ) : (
                        <Chat color="primary" />
                    )}
                    <Typography variant="body2">
                        {session.type} • {session.duration}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <CalendarToday color="primary" />
                    <Typography variant="body2">{session.date}</Typography>
                </Stack>

            </CardContent>
        </Card>
    );
};

export default SessionCard;