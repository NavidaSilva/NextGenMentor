import { AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

const DashboardHeader = ({ user }) => {
    return (
        <AppBar position="static" sx={{ backgroundColor: '#5fcf80' }} elevation={1}>
            <Toolbar>
                <Typography variant="h6" color={"#ffffff"} component="div" sx={{ flexGrow: 1 }}>
                    NextGenMentor
                </Typography>

                <NotificationBell />
                <ProfileMenu user={user} />
            </Toolbar>
        </AppBar>
    );
};

export default DashboardHeader;