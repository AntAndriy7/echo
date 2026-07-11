import styles from './Tabs.module.css';

interface TabOption<T extends string> {
    id: T;
    label: string;
}

interface TabsProps<T extends string> {
    options: readonly TabOption<T>[];
    activeTab: T;
    onChange: (tabId: T) => void;
}

export const Tabs = <T extends string>({ options, activeTab, onChange }: TabsProps<T>) => {
    return (
        <div className={styles.tabs}>
            {options.map((option) => (
                <button
                    key={option.id}
                    className={`${styles.tab} ${activeTab === option.id ? styles.activeTab : ''}`}
                    onClick={() => onChange(option.id)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};