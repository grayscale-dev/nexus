import About from './pages/About';
import ApiDocs from './pages/ApiDocs';
import Board from './pages/Board';
import Changelog from './pages/Changelog';
import Docs from './pages/Docs';
import Feedback from './pages/Feedback';
import Home from './pages/Home';
import JoinWorkspace from './pages/JoinWorkspace';
import Pricing from './pages/Pricing';
import Roadmap from './pages/Roadmap';
import Support from './pages/Support';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Workspaces from './pages/Workspaces';
import FeedbackLegacy from './pages/FeedbackLegacy';
import RoadmapLegacy from './pages/RoadmapLegacy';
import ChangelogLegacy from './pages/ChangelogLegacy';
import DocsLegacy from './pages/DocsLegacy';
import SupportLegacy from './pages/SupportLegacy';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "ApiDocs": ApiDocs,
    "Board": Board,
    "Changelog": Changelog,
    "Docs": Docs,
    "Feedback": Feedback,
    "Home": Home,
    "JoinWorkspace": JoinWorkspace,
    "Pricing": Pricing,
    "Roadmap": Roadmap,
    "Support": Support,
    "WorkspaceSettings": WorkspaceSettings,
    "Workspaces": Workspaces,
    "FeedbackLegacy": FeedbackLegacy,
    "RoadmapLegacy": RoadmapLegacy,
    "ChangelogLegacy": ChangelogLegacy,
    "DocsLegacy": DocsLegacy,
    "SupportLegacy": SupportLegacy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};