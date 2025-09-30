import { keyframes } from '@emotion/react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import YouTubeIcon from '@mui/icons-material/YouTube';
import {
    alpha,
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Toolbar,
    Typography,
    useTheme
} from '@mui/material';
import { InvoiceLogoImg } from '../svg/InvoiceLogo/InvoiceLogo';
import { darkGoldGradient, darkGradient, lightGoldGradient, lightGradient, softBg } from '../utils/const';

const shine = keyframes`
  0% { transform: translateX(-100%) }
  100% { transform: translateX(200%) }
`;

const marquee = keyframes`
  0% { transform: translateX(0) }
  100% { transform: translateX(-50%) }
`;


function Feature({ icon, title, desc }: any) {
    return (
        <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
            </Box>
        </Stack>
    );
}

function ProductCard({ title, price, tag, Illustration }: any) {
    const theme = useTheme()
    return (
        <Card
            sx={{
                height: '100%',
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(137, 76, 76, 0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(6px)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform .3s ease, box-shadow .3s ease',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,.35)'
                }
            }}
        >
            {tag && (
                <Chip
                    label={tag}
                    size="small"
                    sx={{ position: 'absolute', top: 14, left: 14, background: theme.palette.mode === 'dark' ? 'rgba(212,175,55,0.25)' : 'rgba(171, 137, 27, 0.25)', border: '1px solid rgba(212,175,55,0.5)', color: theme.palette.mode === 'dark' ? '#FFF6B7' : '#fd8c1bff', fontWeight: 700 }}
                />
            )}
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ height: 160, position: 'relative' }}>
                    {Illustration}
                    {/* sheen */}
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(75deg, transparent 0%, rgba(255,255,255,.06) 45%, rgba(255,255,255,.25) 50%, rgba(255,255,255,.06) 55%, transparent 100%)',
                        transform: 'skewX(-12deg) translateX(-150%)',
                        animation: `${shine} 3s ease-in-out infinite`,
                        mixBlendMode: 'screen',
                    }} />
                </Box>
                <CardContent sx={{ px: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">Handcrafted 22K artistry</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, background: theme.palette.mode === 'dark' ? darkGoldGradient : lightGoldGradient, WebkitBackgroundClip: 'text', color: 'transparent' }}>
                            {price}
                        </Typography>
                        <Button endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 999, textTransform: 'none' }}>View</Button>
                    </Stack>
                </CardContent>
            </Box>
        </Card>
    );
}

export default function KANANHomePage() {
    const theme = useTheme()

    return (
        <Box sx={{ minHeight: '100vh', background: theme.palette.mode === "dark" ? darkGradient : lightGradient }}>
            {/* Decorative background */}
            <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: softBg }} />

            {/* App Bar */}
            <AppBar position="sticky" sx={{ top: 0, background: (t) => alpha(t.palette.background.paper, 0.6), borderBottom: (t) => `1px solid ${alpha(t.palette.common.white, 0.06)}`, backdropFilter: 'blur(8px)' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <InvoiceLogoImg width={100} height={100} />

                    <Stack direction={{ xs: 'row', md: 'row' }} spacing={1.5} alignItems="center">
                        <Box sx={{ display: { xs: 'block', md: 'block' } }}>
                            <TextField
                                size="small"
                                placeholder="Search jewelry"
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchRoundedIcon />
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                                sx={{
                                    minWidth: 240,
                                    '& .MuiOutlinedInput-root': { borderRadius: 999 },
                                }}
                            />
                        </Box>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Hero */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ py: { xs: 8, md: 12 } }}>
                    <Grid container spacing={6} alignItems="center">
                        <Grid sx={{ xs: 12, md: 7 }}>
                            <Stack spacing={3}>
                                <Chip label="NEW SEASON" sx={{ width: 'fit-content', background: theme.palette.mode === 'dark' ? 'rgba(212,175,55,0.2)' : 'rgba(136, 105, 0, 0.2)', color: theme.palette.mode === 'dark' ? '#FFF6B7' : '#fd8c1bff', border: '1px solid rgba(212,175,55,0.45)', fontWeight: 700 }} />
                                <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
                                    Timeless Gold by{' '}
                                    <Box component="span" sx={{ background: theme.palette.mode === 'dark' ? darkGoldGradient : lightGoldGradient, WebkitBackgroundClip: 'text', color: 'transparent' }}>KANAN</Box>
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    Discover handcrafted 22K & 18K pieces inspired by heritage motifs and modern minimalism. Designed to be worn for a lifetime.
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button size="large" variant="contained" sx={{
                                        px: 3.5,
                                        borderRadius: 999,
                                        background: theme.palette.mode === 'dark' ? darkGoldGradient : lightGoldGradient,
                                        fontWeight: 800,
                                        '&:hover': { filter: 'brightness(1.05)' }
                                    }}>Shop Collections</Button>
                                    <Button size="large" variant="outlined" sx={{ px: 3.5, borderRadius: 999, borderColor: 'rgba(212,175,55,0.5)', color: theme.palette.mode === 'dark' ? '#FFF6B7' : '#fd8c1bff' }}>Book Appointment</Button>
                                </Stack>

                                {/* Feature bullets */}
                                <Grid container spacing={3} sx={{ mt: 1 }}>
                                    <Grid sx={{ xs: 12, sm: 4 }}>
                                        <Feature icon={<SecurityRoundedIcon />} title="Assured Purity" desc="BIS-hallmarked & authenticated." />
                                    </Grid>
                                    <Grid sx={{ xs: 12, sm: 4 }}>
                                        <Feature icon={<VerifiedRoundedIcon />} title="Certified" desc="GIA/IGI certified stones." />
                                    </Grid>
                                    <Grid sx={{ xs: 12, sm: 4 }}>
                                        <Feature icon={<PaidRoundedIcon />} title="Buyback" desc="Lifetime exchange & upgrades." />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Marquee */}
            <Box sx={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', py: 1, background: 'rgba(0,0,0,.25)' }}>
                <Box sx={{ display: 'flex', whiteSpace: 'nowrap', animation: `${marquee} 20s linear infinite`, }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Stack key={i} direction="row" alignItems="center" spacing={1.2} sx={{ mr: 4 }}>
                            <StarRoundedIcon fontSize="small" />
                            <Typography variant="caption" sx={{ letterSpacing: 2 }}>KANAN • HERITAGE • 22K • 18K • DIAMONDS</Typography>
                        </Stack>
                    ))}
                </Box>
            </Box>

            {/* Collections Grid */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
                <Stack spacing={3} sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>Featured Collections</Typography>
                    <Typography color="text.secondary">A curated selection of rings, necklaces, and bracelets — designed in-house and made with ethically sourced gold.</Typography>
                </Stack>
                <Grid container spacing={3}>
                    <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
                        <ProductCard title="Heritage Rings" price="$1,280" tag="Bestseller" Illustration={<Box width={190} component={'img'} src='images/bg/ring.png' alt='bestseller' />} />
                    </Grid>
                    <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
                        <ProductCard title="Minimal Necklaces" price="$980" tag="New" Illustration={<Box width={180} component={'img'} src='images/bg/minimalnecklace.png' alt='newproduct' />} />
                    </Grid>
                    <Grid sx={{ xs: 12, sm: 6, md: 4 }}>
                        <ProductCard title="Classic Bracelets" price="$1,150" Illustration={<Box pb={1} width={175} component={'img'} src='images/bg/cartierbracelet.png' alt='newproduct' />} />
                    </Grid>
                </Grid>
            </Container>

            {/* Story / CTA */}
            <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
                <Grid container spacing={6}>
                    <Grid sx={{ xs: 12, md: 6 }}>
                        <Box sx={{
                            borderRadius: 4,
                            p: 4,
                            background: 'linear-gradient(180deg, rgba(212,175,55,0.12), rgba(255,246,183,0.04))',
                            border: '1px solid rgba(212,175,55,0.35)'
                        }}>
                            <Typography variant="overline" sx={{ letterSpacing: 2 }}>The KANAN Way</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>Crafted with Purpose</Typography>
                            <Typography sx={{ mt: 1.5 }} color="text.secondary">
                                Every KANAN piece begins with a sketch and a story. Our artisans bring heritage techniques to contemporary forms, finishing each surface to a soft glow — never brash, always elegant.
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                <Button variant="contained" sx={{ background: theme.palette.mode === 'dark' ? darkGoldGradient : lightGoldGradient, color: '#111', borderRadius: 999, fontWeight: 800 }}>Visit a Boutique</Button>
                                <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} sx={{ color: theme.palette.mode === 'dark' ? '#FFF6B7' : '#fd8c1bff' }}>Our Story</Button>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Newsletter */}
            <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
                <Box sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    textAlign: 'center'
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Join the KANAN Circle</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>Be the first to know about new drops, private previews, and atelier events.</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
                        <TextField placeholder="you@email.com" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }} />
                        <Button variant="contained" sx={{ background: theme.palette.mode === 'dark' ? darkGoldGradient : lightGoldGradient, color: '#111', borderRadius: 999, px: 3, fontWeight: 800 }}>Subscribe</Button>
                    </Stack>
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', py: 4, background: 'rgba(0,0,0,0.5)' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3} alignItems="center">
                        <Grid sx={{ xs: 12, md: 6 }}>
                            <InvoiceLogoImg width={100} height={100} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>© {new Date().getFullYear()} KANAN Gold. All rights reserved.</Typography>
                        </Grid>
                        <Grid sx={{ xs: 12, md: 6 }}>
                            <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <IconButton color="inherit"><InstagramIcon /></IconButton>
                                <IconButton color="inherit"><FacebookIcon /></IconButton>
                                <IconButton color="inherit"><YouTubeIcon /></IconButton>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}
