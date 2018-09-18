# waldo
udp broadcasting experiments

## sending/watching udp broadcast packets locally

install socat ```sudo apt install socat```. 

listen for udp packets using tcpdump:

```tcpdump -l | grep UDP```

In a different terminal, start a broadcaster using:

```socat STDIO UDP4-DATAGRAM:255.255.255.255:6666,broadcast```

now start typing stuff in the broadcaster. 

now tcpdump receive packages from broadcast address/port 255.255.255.255:6666 .

Note that the broadcaster does not know about the client (does not know its IP address).

## sending/watching udp broadcast packets with two separate computers

start tcpdump on computer A

start the broadcaster on computer B

If both computers are on the same wireless network, then A should receive UDP packets from B.

## sending/watching udp broadcast package with two separate computer connected to different mesh nodes

repeat above, only with computer A and B connected to separate meshing nodes.

(apply magic) 

Turns out that sudomesh router do *not* route udp broadcast packets to meshing nodes.

For example, if computer A sends a udp broadcast packet to 255.255.255.255:6666, the router interfaces open5 and br-open receive the udp package, but router interface mesh2 or mesh5 do not. The mesh2,5 interfaces are used for local meshing between nodes.

So, we need to change the xyz rules to enable forwarding to the mesh2 or mesh5 interfaces.
