ps -axo pcpu,pmem,pid,command  | grep -v grep | grep -iE "mystring"

ps -axo pcpu,pmem,pid,command  | grep -v grep | grep -iE "unattended-upgrades"