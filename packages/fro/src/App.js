import { useState, useCallback, useContext, useEffect, useMemo } from "react";
// import Speaker from "audio-speaker/stream";
// import Generator from "audio-generator/stream";
import { debounce } from "debounce";
import { Resizable } from "re-resizable";
import yaml from "yaml";
// import useFetch from "use-http";
// import useLocalStorage from "use-local-storage";
import JSONViewer from "react-json-viewer";
// import jwt from "jwt-promisify";
import {
    PrimaryButton,
    Button,
    TextField,
    Label,
    ActionButton,
    MessageBarButton,
    CompoundButton,
    CommandButton,
    DefaultButton,
    Popup,
    Modal,
    Dialog,
    SearchBox,
    Stack,
    DialogContent,
    Spinner,
    StackItem,
} from "@fluentui/react";
import { useForm } from "react-hook-form";
import { CSV } from "tsv";
// import { Button } from "antd";
// import "antd/dist/antd.css";
import "./styles.css";
// import { 对列表, 睡 } from "sno-utils";
import useInterval from "react-useinterval";
import useLocalStorage from "use-local-storage";
// import useLocalStorage from "react-use-localstorage";
// import webaudio from "webaudio";
const H3 = ({ name }) => (
    <h3 id={name}>
        <a href={"#" + name}> {name}</a>
    </h3>
);
const jsonDateReviver = (_key, value) => {
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
        const dt = new Date(value);
        return dt.toLocaleString();
        // return dt;
    }
    return value;
};
const jsonpParse = jsonp => {
    return JSON.parse(jsonp.slice(2, -1), jsonDateReviver);
    // const _ = json => json;
    // try {
    //     return eval(jsonp); //json.length === 1 ? json[0] : json;
    // } catch (e) {
    //     return null;
    // }
};
let snocrawler_token = "";

const AccountPut = () => {
    const { register, handleSubmit, ...form } = useForm();
    const onSubmit = async ({ 账号, 密码, 来源 }) => {
        const 提交表 = {
            任务v2_天眼查_账号池: { 索引: { 账号: 1 }, 表列: [{ 账号, 密码, 来源, 导入于: new Date() }] },
        };
        const 返回值 = await apiPost("/put", 提交表).catch(err => form.setError("账号", err.message));
        form.reset();
        // form.setValue("账号", "");
        // form.setValue("密码", "");
        alert(JSON.stringify(返回值));
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="账号提交" />
            <TextField {...register("账号")} placeholder="账号" />
            <TextField {...register("密码")} placeholder="密码" />
            <TextField {...register("来源")} placeholder="来源" />
            <PrimaryButton type="submit">提交</PrimaryButton>
        </form>
    );
};
const AccountErrorPut = () => {
    const { register, handleSubmit } = useForm();
    const onSubmit = async ({ 账号, 错误 }) => {
        const 提交表 = {
            任务v2_天眼查_账号池: {
                索引: { 账号: 1 },
                表列: [{ 账号: Number(账号), 错误 }],
            },
        };
        alert(JSON.stringify(提交表));
        const 返回值 = await apiPost("/put", 提交表);
        console.log(返回值);
        alert(JSON.stringify(返回值));
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="账号错误提交" />
            <Label>
                <TextField label="账号" {...register("账号")} />
            </Label>
            <Label>
                <TextField label="错误" {...register("错误")} />
            </Label>
            <PrimaryButton type="submit">提交</PrimaryButton>
        </form>
    );
};

const CompanySearchTaskImporter = () => {
    const { register, handleSubmit, formState } = useForm();
    const [state, setState] = useState({ error: "" });
    const onSubmit = async ({ CSV公司数据 }) => {
        setState({ error: "正在提交..." });
        const 表列 = CSV.parse(CSV公司数据.trim())
            // .filter((e) => e.主体名称)
            .map(({ 主体名称, 主体ID }) => ({ 搜索词: 主体名称, 主体ID, 主体名称 }));
        if (!表列.length) {
            return setState({ error: "请填入CSV数据，主要字段为主体名称" });
        }
        if (!表列.every(({ 搜索词, 主体名称 }) => 搜索词 && 主体名称)) {
            alert(JSON.stringify(表列.filter(e => !e.主体名称)));
            return setState({ error: "主体名称或搜索词未设定" });
        }
        alert(JSON.stringify(表列, null, 4));
        const 提交表 = {
            任务v2_天眼查_公司搜索任务: { 索引: { 搜索词: 1 }, 表列 },
        };
        alert(JSON.stringify(提交表));
        const 返回值 = await apiPost("/put", 提交表);
        console.log(返回值);
        alert(JSON.stringify(返回值));
        return setState({ error: "提交成功" });
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <H3 name="公司搜索任务提交" />
            <TextField {...register("CSV公司数据")} multiline rows={5} />
            <PrimaryButton type="submit" text="提交" />
            {state.error}
        </form>
    );
};

const apiBase = "/api";
const corsOptions = {
    mode: "cors",
    credentials: "include",
};
const authHeadersGet = () => {
    const tokenStr = localStorage.getItem("crawlerToken");
    const token = tokenStr && JSON.parse(tokenStr);
    return {
        Authorization: "Basic " + (token || "snocrawler"),
    };
};
const apiFetch = async (path, body = null) =>
    await fetch(apiBase + path, {
        ...corsOptions,
        headers: { ...authHeadersGet() },
        ...(body && {
            method: "post",
            headers: { "content-type": "application/json", ...authHeadersGet() },
            body: JSON.stringify(body),
        }),
    })
        .then(e => e.text())
        .then(jsonpParse);
const apiGet = async (api, search = {}) => await apiFetch(!search ? api : `${api}?${new URLSearchParams(search).toString()}`);
const apiPost = async (api, body = null) => await apiFetch(api, body);

const JSON齐化 = json => {
    const 是表列 = json?.every?.(e => typeof e === "object");
    if (!是表列) return json;
    const 共键列 = [...new Set(json.flatMap(e => Object.keys(e)))];
    const 表共键补齐 = 表 => Object.fromEntries(共键列.map(键 => [键, 表[键]]));
    return json.map(表共键补齐);
};
const useApiFetch = (url, body, { onLoad }) => {
    const [json, setJsonData] = useState(null);
    const [{ loading, error }, setState] = useState({
        loading: false,
        error: null,
    });
    useEffect(() => {
        setState({ loading: true, error: null });
        apiFetch(url, body)
            .then(json => {
                setJsonData(json);
                onLoad(json);
            })
            .then(() => setState({ loading: false, error: null }))
            .catch(err => setState({ loading: false, error: err.message }));
    }, [body, url]);
    return { json: JSON齐化(json), loading, error };
};
// const useBeeper = ({ freq, vol }) => {
//   let setBeep;
//   [{ freq, vol }, setBeep] = useState({ freq, vol });
//   useEffect(() => {
//     Generator(function (time) {
//       // panned unisson effect
//       var τ = Math.PI * 2;
//       const ch1 = Math.sin(τ * time * freq) * vol;
//       const ch2 = Math.sin(τ * time * freq) * vol;
//       return [ch1, ch2];
//     }).pipe(Speaker({}));
//   });
//   return [setBeep];
// };
export const ApiFetchViewer = ({ name, url, body, interval = 0, children }) => {
    const [rand, setRand] = useState(0);
    const onLoad = json => {
        const freq = 440 * json?.访问数量?.分钟;
        // freq && beep(freq);
    };
    const { json, error, loading } = useApiFetch(`${url}?${rand}`, body, {
        onLoad,
    });
    const jsonCopy = async () => await navigator.clipboard.writeText(JSON.stringify(json, null, 4));
    const yamlCopy = async () => await navigator.clipboard.writeText(yaml.stringify(json, null, 4));
    const update = () => setRand(Math.random());
    useInterval(update, interval);
    return (
        <div>
            <div className={["header", loading && "loading", error && "error"].filter(e => e).join(" ")}>
                <H3 name={name} />
                {loading && <Spinner />}
                <div className="status">
                    {/* <ActionButton className="loading">Loading...</ActionButton> */}
                    {/* {loading && <ActionButton className="loading">Loading...</ActionButton>}
                    {error && <ActionButton className="error">Error...</ActionButton>} */}
                    {children}
                    <ActionButton onClick={jsonCopy} text="JSON复制" />
                    <ActionButton onClick={yamlCopy} text="YAML复制" />
                    <ActionButton onClick={update} text="刷新" />
                </div>
            </div>
            <div className="jsonViewer">{json && <JSONViewer json={json} />}</div>
        </div>
    );
};
/* const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Chart.js Line Chart - Logarithmic'
      }
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
        type: 'logarithmic',
      }
    }
  },
};
 */

export const ApiAuthDialog = () => {
    const [token, setToken] = useLocalStorage("crawlerToken", null);
    const { register, handleSubmit, ...form } = useForm();
    const [error, setError] = useState(null);
    const onSubmit = async ({ 用户名, 密码 }) => {
        await apiPost("/login", { 用户名, 密码 })
            .then(({ code, 错误, 令牌 }) => {
                if (错误) throw new Error(错误);
                console.log(令牌);
                setToken(令牌);
                console.log(token);
            })
            .catch(err => setError(err.message));
    };
    return (
        <Dialog hidden={false}>
            <h3>系统登录</h3>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField label="用户名" {...register("用户名")} errorMessage={error} />
                    <TextField label="密码" {...register("密码")} type="password" />
                    {error}
                    <PrimaryButton text="登录" type="submit" />
                </form>
            </DialogContent>
        </Dialog>
    );
};
export const ApiProvider = ({ children }) => {};
export const ApiAuthProvider = ({ children }) => {
    const [token, setToken] = useLocalStorage("crawlerToken", null);
    if (token) {
        return <>{children}</>;
    }
    return token ? children : <ApiAuthDialog />;
};
export const ModalButton = ({ children, ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <ActionButton onClick={() => setIsOpen(true)} {...props} />
            <Modal {...{ isOpen }} onDismiss={() => setIsOpen(false)}>
                <div style={{ padding: "1rem", width: "35rem" }}>{children}</div>
            </Modal>
        </>
    );
};
export const DataSearcher = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [filters, setFilters] = useState(null);
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const onChange = (e, value) => {
        setQuery(value);
    };
    const jsonCopy = async () => await navigator.clipboard.writeText(JSON.stringify(results, null, 4));
    const yamlCopy = async () => await navigator.clipboard.writeText(yaml.stringify(results, null, 4));
    const search = async query => {
        // alert(query);
        setLoading(true);
        await apiPost("/tyc/search", { query })
            .then(e => setResults(e || []))
            .catch(e => setError(e.message));
        setLoading(false);
    };
    return (
        <div>
            <div className={["header", loading && "loading", error && "error"].filter(e => e).join(" ")}>
                <H3 name="公司搜索" />
                {loading && <Spinner />}
                <div className="status">
                    <ModalButton text="未找到满意结果？新搜索/任务 导入">
                        <CompanySearchTaskImporter />
                    </ModalButton>
                    {results && (
                        <>
                            <ActionButton onClick={jsonCopy} text="JSON复制" />
                            <ActionButton onClick={yamlCopy} text="YAML复制" />
                        </>
                    )}
                </div>
            </div>
            <Stack horizontal>
                <StackItem grow={1}>
                    <SearchBox
                        // value={query}
                        // onChange={onChange}
                        onSearch={search}
                        placeholder={"https://www.tianyancha.com/company/XXXXX 或 上海XXXX有限公司"}
                        iconProps={{ iconName: "Search", hidden: false, styles: { root: { display: "block" } } }}
                        // onClick={() => (searchBoxRef.hidden = false)}
                    />
                </StackItem>
                <DefaultButton text="搜索" onClick={search} />
            </Stack>

            <div className="jsonViewer">{results && <JSONViewer json={results} />}</div>
        </div>
    );
};
export const NotFound = () => "Welcome to starhouse.ai crawler manager";
export default function App() {
    return (
        <div>
            {/* <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem"
        }}
      >
        <Link to="/search">Search</Link> | <Link to="/company">Company</Link>
      </nav> */}
            <header>
                <h1>格爬/数据监视管理面板/天眼查</h1>
            </header>
            <div className="App">
                <ApiAuthProvider>
                    <Stack /* className="App" */ style={{ padding: "1rem", maxWidth: "70em" }} tokens={{ childrenGap: "1em" }}>
                        <DataSearcher />
                        <ApiFetchViewer name="资源使用情况" url={"/balance"} interval={3e3} />
                        {/* 任务进度 */}
                        <ApiFetchViewer name="数据抓取任务进度" url={"/company/progress"} interval={3e3} />
                        <ApiFetchViewer name="公司搜索任务进度" url={"/search/progress"} interval={3e3} />
                        {/* 资源列表 */}
                        <TycAccounts />
                        {/* <ApiFetchViewer
        name="最近解析"
        url={"/company/latest/parse"}
        interval={60e3}
      /> */}
                        {/* <Outlet /> */}
                    </Stack>
                </ApiAuthProvider>
            </div>
            <footer>关于格爬：Copyright(c) 2020-2021 snomiao.com </footer>
        </div>
    );
}
function TycAccounts() {
    return (
        <ApiFetchViewer name="账号列表" url={"/tyc/account/list"} interval={10e3}>
            <ModalButton text="账号提交">
                <AccountPut />
            </ModalButton>
            <ModalButton text="账号错误提交">
                <AccountErrorPut />
            </ModalButton>
        </ApiFetchViewer>
    );
}
